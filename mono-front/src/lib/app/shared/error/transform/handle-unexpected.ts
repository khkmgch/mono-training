import { isHttpError } from '$lib/core/http';
import { toAppError } from './to-app-error';

/**
 * Used as the return value of `HandleServerError` / `HandleClientError`.
 *
 * @remarks Must NEVER throw — that is SvelteKit's contract for these hooks.
 *   `HttpError` is normalized through {@link toAppError}; anything else is wrapped
 *   as `'SYSTEM'`.
 */
export function handleUnexpected(input: {
	error: unknown;
	status: number;
	message: string;
}): App.Error {
	const { error, status, message } = input;
	if (isHttpError(error)) {
		return toAppError(error, { status, message });
	}
	return {
		message,
		code: 'SYSTEM',
		action: 'page',
		status
	};
}
