import { isHttpError } from '$lib/core/http';
import { toAppError } from './to-app-error';

/**
 * Used as the return value of `HandleServerError` / `HandleClientError`.
 *
 * @remarks Must NEVER throw — that is SvelteKit's contract for these hooks.
 *   `HttpError` is normalized through {@link toAppError} (so `requestId`
 *   prefers BE-provided values). Anything else is wrapped as `'SYSTEM'` with
 *   a fresh client-generated `requestId`.
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
	const fallback: App.Error = {
		message,
		code: 'SYSTEM',
		action: 'page',
		status
	};
	const requestId = generateRequestId();
	if (requestId !== undefined) fallback.requestId = requestId;
	return fallback;
}

function generateRequestId(): string | undefined {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return undefined;
}
