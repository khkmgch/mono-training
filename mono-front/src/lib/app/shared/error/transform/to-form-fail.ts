import { fail, type ActionFailure } from '@sveltejs/kit';
import { isHttpError, type HttpError } from '$lib/core/http';
import { toAppError } from './to-app-error';

/**
 * Convert a thrown error into the SvelteKit `fail()` shape so the form action
 * re-renders with `form.error` populated. The original input values are
 * forwarded so the form can repopulate them on the next render.
 */
export function toFormFail<T extends Record<string, unknown>>(
	err: HttpError | App.Error,
	values?: T
): ActionFailure<T & { error: App.Error }> {
	const appErr = isHttpError(err) ? toAppError(err) : err;
	const status = appErr.status ?? 400;
	const payload = { ...(values ?? ({} as T)), error: appErr } as T & { error: App.Error };
	return fail(status, payload);
}
