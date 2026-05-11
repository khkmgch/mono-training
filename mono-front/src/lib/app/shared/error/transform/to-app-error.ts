import type { HttpError } from '$lib/core/http';
import type { AppErrorCode, FieldError, ProblemValidationError } from '../types';
import { inferAction, inferCode } from './problem-mapping';

/**
 * Convert an {@link HttpError} into the application-level {@link App.Error}.
 *
 * @remarks
 * - `code` defaults to {@link inferCode}; `action` defaults to {@link inferAction}(code).
 * - `fields` reads `err.problem?.errors` as `ProblemValidationError[]` (RFC 9457 §3
 *   top-level extension members; not nested under `extensions`) and maps to
 *   {@link FieldError}[]. Empty / malformed entries are dropped silently.
 * - `requestId` priority: (1) BE response header `X-Request-Id`,
 *   (2) ProblemDetails `instance`, (3) FE-generated `crypto.randomUUID()`.
 * - `retryable` is `true` for `NETWORK` / `TIMEOUT` / `RATE_LIMIT`.
 * - `retryAfterSec` is set when status is 429 / 503 and `Retry-After` is numeric.
 * - `override` wins for any field — even falsy values (e.g. `fields: []`) — so
 *   callers can deliberately suppress inferred values.
 */
export function toAppError(err: HttpError, override?: Partial<App.Error>): App.Error {
	const code = override?.code ?? inferCode(err);
	const action = override?.action ?? inferAction(code);
	const fields = pickField(override, 'fields') ?? extractFields(err);
	const requestId = pickField(override, 'requestId') ?? extractRequestId(err);
	const retryable = pickField(override, 'retryable') ?? isRetryable(code);
	const retryAfterSec = pickField(override, 'retryAfterSec') ?? extractRetryAfter(err);
	const message = override?.message ?? defaultMessage(err);
	const status = pickField(override, 'status') ?? err.status;

	const result: App.Error = { message, code, action };
	if (status !== undefined) result.status = status;
	if (requestId !== undefined) result.requestId = requestId;
	if (fields !== undefined) result.fields = fields;
	if (retryable) result.retryable = true;
	if (retryAfterSec !== undefined) result.retryAfterSec = retryAfterSec;
	return result;
}

function pickField<K extends keyof App.Error>(
	override: Partial<App.Error> | undefined,
	key: K
): App.Error[K] | undefined {
	if (override === undefined) return undefined;
	return Object.hasOwn(override, key) ? override[key] : undefined;
}

function extractFields(err: HttpError): ReadonlyArray<FieldError> | undefined {
	const errors = err.problem?.errors;
	if (!Array.isArray(errors)) return undefined;
	const fields: FieldError[] = [];
	for (const entry of errors) {
		if (typeof entry !== 'object' || entry === null) continue;
		const candidate = entry as ProblemValidationError;
		if (typeof candidate.name !== 'string' || typeof candidate.message !== 'string') continue;
		const field: FieldError = { name: candidate.name, message: candidate.message };
		if (typeof candidate.code === 'string') field.code = candidate.code;
		fields.push(field);
	}
	return fields.length > 0 ? fields : undefined;
}

function extractRequestId(err: HttpError): string | undefined {
	const header = err.response?.headers.get('x-request-id');
	if (header !== null && header !== undefined && header !== '') return header;
	const instance = err.problem?.instance;
	if (typeof instance === 'string' && instance !== '') return instance;
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return undefined;
}

function isRetryable(code: AppErrorCode): boolean {
	return code === 'NETWORK' || code === 'TIMEOUT' || code === 'RATE_LIMIT';
}

function extractRetryAfter(err: HttpError): number | undefined {
	if (err.status !== 429 && err.status !== 503) return undefined;
	const header = err.response?.headers.get('retry-after');
	if (header === null || header === undefined || header === '') return undefined;
	const seconds = Number(header);
	return Number.isFinite(seconds) ? seconds : undefined;
}

function defaultMessage(err: HttpError): string {
	const detail = err.problem?.detail;
	if (typeof detail === 'string' && detail !== '') return detail;
	const title = err.problem?.title;
	if (typeof title === 'string' && title !== '') return title;
	return err.message;
}
