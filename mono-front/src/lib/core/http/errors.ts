/**
 * Error types and runtime guards for `core/http`.
 *
 * The class extends the standard `Error` so consumers can use both
 * `instanceof Error` and `isHttpError(err)` for narrowing. Because the SvelteKit
 * `HttpError` (`@sveltejs/kit`) does not extend `Error` and has a different
 * field shape, the two never collide structurally.
 */

/**
 * RFC 9457 Problem Details object.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 * @remarks All members are optional; `type` defaults to `about:blank` per spec.
 *   Unknown extension members are preserved on the `[k: string]: unknown` index
 *   signature — clients must ignore unrecognized members to remain forward-compatible.
 */
export type ProblemDetails = Readonly<{
	type?: string;
	title?: string;
	status?: number;
	detail?: string;
	instance?: string;
}> &
	Readonly<Record<string, unknown>>;

/** Discriminator for {@link HttpError}. */
export type HttpErrorKind = 'http' | 'network' | 'timeout' | 'parse';

/**
 * Error thrown by `core/http` for any failure in the request/response cycle.
 *
 * @remarks Distinguish failure modes via {@link HttpError.kind}:
 * - `'http'`: response received with non-2xx status. `response` and `status` are set.
 * - `'network'`: the underlying `fetch` rejected (e.g. DNS / connection failure).
 *   `cause` holds the original `TypeError`.
 * - `'timeout'`: the request was aborted by `timeoutMs`. `cause` holds the
 *   `DOMException` with `name === 'TimeoutError'`.
 * - `'parse'`: response received but body deserialization failed. `response`
 *   and `cause` (e.g. `SyntaxError`) are set.
 *
 * External aborts (caller's `AbortController.abort`) are NOT wrapped — they
 * surface as the original abort reason so the caller's intent is preserved.
 */
export class HttpError extends Error {
	override readonly name = 'HttpError';
	readonly kind: HttpErrorKind;
	readonly request: Request;
	readonly response?: Response;
	readonly status?: number;
	readonly problem?: ProblemDetails;

	constructor(init: {
		kind: HttpErrorKind;
		message: string;
		request: Request;
		response?: Response;
		status?: number;
		problem?: ProblemDetails;
		cause?: unknown;
	}) {
		super(init.message, init.cause !== undefined ? { cause: init.cause } : undefined);
		this.kind = init.kind;
		this.request = init.request;
		this.response = init.response;
		this.status = init.status;
		this.problem = init.problem;
	}
}

/**
 * Type guard for {@link HttpError}.
 *
 * @remarks Uses `instanceof` first, then a duck-typed fallback so cross-realm
 *   errors (e.g. those crossing iframe / worker boundaries) still narrow correctly.
 *   Values produced by SvelteKit's `error()` helper do NOT match (different shape:
 *   `{ status, body }` without a `name` field).
 */
export function isHttpError(err: unknown): err is HttpError {
	if (err instanceof HttpError) return true;
	if (typeof err !== 'object' || err === null) return false;
	const e = err as { name?: unknown; kind?: unknown; request?: unknown };
	return e.name === 'HttpError' && typeof e.kind === 'string' && e.request instanceof Request;
}
