import { error as svelteError, fail, type ActionFailure } from '@sveltejs/kit';
import { isHttpError } from '$lib/core/http';
import { toAppError } from './to-app-error';

/**
 * Funnel a `load`-thrown error into `+error.svelte`. `HttpError` is normalized;
 * non-`HttpError` is re-thrown so SvelteKit's `handleError` hook can pick it up.
 */
export function dispatchLoadError(err: unknown): never {
	if (!isHttpError(err)) throw err;
	const appErr = toAppError(err);
	const status = appErr.status ?? 500;
	throw svelteError(status, appErr);
}

/**
 * Funnel a form-action-thrown error into the response based on
 * `App.Error.action` (per design 8.3.3.1):
 * - `'inline'` / `'banner'` → return `fail()` with `{ ...values, error }`
 * - `'page'` (default) → throw `error()` so `+error.svelte` renders
 *
 * Non-`HttpError` is re-thrown so `handleError` can capture it.
 */
export function dispatchActionError<T extends Record<string, unknown>>(
	err: unknown,
	ctx: { values?: T }
): ActionFailure<T & { error: App.Error }> | never {
	if (!isHttpError(err)) throw err;
	const appErr = toAppError(err);
	if (appErr.action === 'inline' || appErr.action === 'banner') {
		const status = appErr.status ?? 400;
		const payload = { ...(ctx.values ?? ({} as T)), error: appErr } as T & {
			error: App.Error;
		};
		return fail(status, payload);
	}
	const status = appErr.status ?? 500;
	throw svelteError(status, appErr);
}
