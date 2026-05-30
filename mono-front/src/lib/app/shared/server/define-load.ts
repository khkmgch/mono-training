import { isHttpError as isKitHttpError, isRedirect, type ServerLoadEvent } from '@sveltejs/kit';
import { dispatchLoadError } from '../error';
import { createAppHttpClient } from '../http';
import type { DefineLoadOptions, LoadHandler } from './types';

/**
 * Build a SvelteKit server `load` function with the project conventions
 * already wired up.
 *
 * Automated steps:
 *   1. `createAppHttpClient` is constructed from `event.fetch`,
 *      `event.locals.apiBaseURL`, and `event.cookies`, then exposed as
 *      `ctx.client`.
 *   2. The handler is awaited; its return value becomes the load result.
 *   3. Anything thrown is funneled through `dispatchLoadError` (default) or
 *      `options.onError` (override). SvelteKit's `error()` / `redirect()`
 *      throws are passed through untouched.
 *
 * @remarks The returned function preserves the handler's return type so that
 *   SvelteKit's generated `PageData` for `+page.svelte` is precise. Avoid
 *   widening it with an explicit annotation:
 *   - ❌ `export const load: PageServerLoad = defineLoad(...)` (widens to `any`)
 *   - ✅ `export const load = defineLoad(...)` (typeof flows to `$types`)
 *   - ✅ `export const load = defineLoad(...) satisfies PageServerLoad`
 *
 * @remarks Pass the route-specific `PageServerLoadEvent` from generated
 *   `./$types` as the `E` generic to narrow `event.params` to required
 *   strings. Without it, `event.params` resolves to the broad
 *   `AppLayoutParams<'/'>` shape where every key is optional.
 *   - ✅ `defineLoad<PageServerLoadEvent>(handler) satisfies PageServerLoad`
 *   - ✅ `defineLoad(handler) satisfies PageServerLoad` (broad params)
 *
 * @example Minimal
 * ```ts
 * export const load = defineLoad(async ({ client }) => ({
 *   users: await client.get<User[]>('/users'),
 * }));
 * ```
 *
 * @example Route-specific params
 * ```ts
 * import type { PageServerLoad, PageServerLoadEvent } from './$types';
 * export const load = defineLoad<PageServerLoadEvent>(async ({ event, client }) => ({
 *   user: await client.get<User>(`/users/${event.params.id}`),
 * })) satisfies PageServerLoad;
 * ```
 *
 * @example Per-call timeout
 * ```ts
 * export const load = defineLoad(
 *   { http: { timeoutMs: 30_000 } },
 *   async ({ client }) => ({ report: await client.get<Report>('/reports/heavy') })
 * );
 * ```
 *
 * @example Custom error mapping (404 -> redirect)
 * ```ts
 * export const load = defineLoad(
 *   {
 *     onError: (err) => {
 *       if (isHttpError(err) && err.status === 404) throw redirect(303, '/users');
 *       dispatchLoadError(err);
 *     }
 *   },
 *   async ({ client, event }) => ({ user: await client.get(`/users/${event.params.id}`) })
 * );
 * ```
 */
export function defineLoad<E extends ServerLoadEvent = ServerLoadEvent, R = unknown>(
	handler: LoadHandler<E, R>
): (event: E) => Promise<R>;
export function defineLoad<E extends ServerLoadEvent = ServerLoadEvent, R = unknown>(
	options: DefineLoadOptions<E>,
	handler: LoadHandler<E, R>
): (event: E) => Promise<R>;
export function defineLoad<E extends ServerLoadEvent = ServerLoadEvent, R = unknown>(
	optionsOrHandler: DefineLoadOptions<E> | LoadHandler<E, R>,
	maybeHandler?: LoadHandler<E, R>
): (event: E) => Promise<R> {
	const [options, handler] = normalizeArgs(optionsOrHandler, maybeHandler);

	return async (event: E): Promise<R> => {
		const client = createAppHttpClient({
			fetch: event.fetch,
			baseURL: options.http?.baseURL ?? event.locals.apiBaseURL,
			cookies: event.cookies,
			timeoutMs: options.http?.timeoutMs
		});
		try {
			return await handler({ event, client });
		} catch (err) {
			if (isKitHttpError(err) || isRedirect(err)) throw err;
			if (options.onError === undefined) {
				dispatchLoadError(err);
			} else {
				options.onError(err, event);
			}
			// Unreachable when onError honors its `=> never` contract; re-throw on TS escape hatches.
			throw err;
		}
	};
}

function normalizeArgs<E extends ServerLoadEvent, R>(
	first: DefineLoadOptions<E> | LoadHandler<E, R>,
	second: LoadHandler<E, R> | undefined
): [DefineLoadOptions<E>, LoadHandler<E, R>] {
	if (typeof first === 'function') return [{}, first];
	if (second === undefined) {
		throw new Error('defineLoad: handler is required when options are provided');
	}
	return [first, second];
}
