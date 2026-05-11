import { error as svelteError } from '@sveltejs/kit';
import { isHttpError, type HttpError } from '$lib/core/http';
import { toAppError } from './to-app-error';

/**
 * Throw SvelteKit `error()` so the request lands on `+error.svelte` directly,
 * skipping the `handleError` hook. Always returns `never`.
 *
 * @throws SvelteKit `HttpError` shaped as `{ status, body: App.Error }`.
 */
export function toSvelteError(err: HttpError | App.Error, override?: Partial<App.Error>): never {
	const appErr: App.Error = isHttpError(err)
		? toAppError(err, override)
		: applyOverride(err, override);
	const status = appErr.status ?? 500;
	throw svelteError(status, appErr);
}

function applyOverride(base: App.Error, override: Partial<App.Error> | undefined): App.Error {
	if (override === undefined) return base;
	const result: App.Error = { ...base };
	for (const key of Object.keys(override) as Array<keyof App.Error>) {
		const value = override[key];
		if (value === undefined) continue;
		Reflect.set(result, key, value);
	}
	return result;
}
