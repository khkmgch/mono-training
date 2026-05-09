import { HttpError, type ProblemDetails } from '../errors';

/**
 * Validate the response status, then auto-deserialize the body based on `Content-Type`:
 * - `application/json` or `application/problem+json` → `response.json()`
 * - `application/octet-stream` → `response.blob()`
 * - anything else → `response.text()`
 *
 * Empty bodies (status 204/205/304, or `Content-Length: 0`, or null body) resolve to `undefined`.
 *
 * @throws {HttpError}
 *   - `kind: 'http'` for non-2xx responses (with `problem` populated when the body is
 *     `application/problem+json` and parses successfully)
 *   - `kind: 'parse'` when the body cannot be deserialized
 */
export async function processResponse<T = unknown>(
	response: Response,
	request: Request
): Promise<T> {
	await ensureOk(response, request);
	if (isEmptyBody(response)) {
		return undefined as T;
	}
	const contentType = parseContentType(response.headers.get('content-type'));
	try {
		if (contentType === 'application/json' || contentType === 'application/problem+json') {
			return (await response.json()) as T;
		}
		if (contentType === 'application/octet-stream') {
			return (await response.blob()) as T;
		}
		return (await response.text()) as T;
	} catch (cause) {
		throw new HttpError({
			kind: 'parse',
			message: `Failed to parse response body${contentType ? ` as ${contentType}` : ''}`,
			request,
			response,
			status: response.status,
			cause
		});
	}
}

/**
 * Throw {@link HttpError} (`kind: 'http'`) when the response is non-2xx; resolve to `void` otherwise.
 * Used by `raw()` and `head()` where body deserialization is not desired.
 */
export async function ensureOk(response: Response, request: Request): Promise<void> {
	if (response.ok) return;
	const problem = await tryReadProblem(response);
	throw new HttpError({
		kind: 'http',
		message: `Request failed with status ${response.status}`,
		request,
		response,
		status: response.status,
		problem
	});
}

async function tryReadProblem(response: Response): Promise<ProblemDetails | undefined> {
	const contentType = parseContentType(response.headers.get('content-type'));
	if (contentType !== 'application/problem+json') return undefined;
	try {
		const cloned = response.clone();
		const data: unknown = await cloned.json();
		if (typeof data === 'object' && data !== null) {
			return data as ProblemDetails;
		}
		return undefined;
	} catch {
		return undefined;
	}
}

function isEmptyBody(response: Response): boolean {
	if (response.body === null) return true;
	if (response.headers.get('content-length') === '0') return true;
	const status = response.status;
	if (status === 204 || status === 205 || status === 304) return true;
	return false;
}

function parseContentType(value: string | null): string | null {
	if (value === null) return null;
	const semi = value.indexOf(';');
	return (semi === -1 ? value : value.slice(0, semi)).trim().toLowerCase();
}
