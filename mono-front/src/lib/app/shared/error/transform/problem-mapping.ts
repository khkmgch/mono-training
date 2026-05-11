import type { HttpError } from '$lib/core/http';
import type { AppErrorAction, AppErrorCode } from '../types';

/**
 * Map from ProblemDetails `type` URN to {@link AppErrorCode}. Extend as the
 * backend adds new problem types.
 */
export const PROBLEM_TYPE_TO_CODE: Readonly<Record<string, AppErrorCode>> = Object.freeze({
	'urn:problem:validation': 'VALIDATION',
	'urn:problem:conflict-unique': 'CONFLICT_UNIQUE',
	'urn:problem:conflict-version': 'CONFLICT_VERSION'
});

/**
 * Infer the {@link AppErrorCode} from an {@link HttpError}.
 *
 * Priority:
 *   1. `kind: 'network' | 'timeout' | 'parse'` map to dedicated codes
 *      (ProblemDetails are ignored — the failure is transport-level).
 *   2. `kind: 'http'` and `problem.type` present in {@link PROBLEM_TYPE_TO_CODE}.
 *   3. `kind: 'http'` falls back to status (404 / 409 / 422 / 429).
 *   4. Anything else: `'SYSTEM'`.
 */
export function inferCode(err: HttpError): AppErrorCode {
	switch (err.kind) {
		case 'network':
			return 'NETWORK';
		case 'timeout':
			return 'TIMEOUT';
		case 'parse':
			return 'PARSE';
		case 'http': {
			const type = err.problem?.type;
			if (typeof type === 'string' && Object.hasOwn(PROBLEM_TYPE_TO_CODE, type)) {
				return PROBLEM_TYPE_TO_CODE[type];
			}
			return statusToCode(err.status);
		}
	}
}

function statusToCode(status: number | undefined): AppErrorCode {
	switch (status) {
		case 404:
			return 'NOT_FOUND';
		case 409:
			return 'CONFLICT_UNIQUE';
		case 422:
			return 'VALIDATION';
		case 429:
			return 'RATE_LIMIT';
		default:
			return 'SYSTEM';
	}
}

/**
 * Default {@link AppErrorAction} for a given {@link AppErrorCode} (design 8.3.3.1).
 *
 * `dispatchActionError` uses the result to decide between `fail()` (inline /
 * banner) and `error()` (page).
 */
export function inferAction(code: AppErrorCode): AppErrorAction {
	switch (code) {
		case 'VALIDATION':
		case 'CONFLICT_UNIQUE':
			return 'inline';
		case 'CONFLICT_VERSION':
		case 'RATE_LIMIT':
		case 'NETWORK':
		case 'TIMEOUT':
			return 'banner';
		case 'NOT_FOUND':
		case 'PARSE':
		case 'SYSTEM':
			return 'page';
	}
}
