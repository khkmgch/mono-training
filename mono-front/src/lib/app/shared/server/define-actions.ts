import {
	isHttpError as isKitHttpError,
	isRedirect,
	type ActionFailure,
	type RequestEvent
} from '@sveltejs/kit';
import { dispatchActionError } from '../error';
import { createAppHttpClient } from '../http';
import type { ActionContext, ActionHandler, DefineActionsOptions } from './types';

type ActionResult<H extends ActionHandler> =
	| Awaited<ReturnType<H>>
	| ActionFailure<Record<string, unknown>>;

type WrappedAction<H extends ActionHandler> = (event: RequestEvent) => Promise<ActionResult<H>>;

type WrappedActions<A extends Record<string, ActionHandler>> = {
	[K in keyof A]: WrappedAction<A[K]>;
};

/**
 * Build a SvelteKit `actions` object with the project conventions wired up.
 *
 * Automated steps for every action handler:
 *   1. `createAppHttpClient` is constructed and exposed as `ctx.client`.
 *   2. `event.request.formData()` is awaited and exposed as `ctx.formData`
 *      (handlers must NOT call it again — the body is already consumed).
 *   3. `ctx.registerValues(values)` records parsed input values; on error
 *      they are forwarded to `dispatchActionError` so the form can repopulate.
 *   4. Anything thrown is funneled through `dispatchActionError` (default)
 *      or `options.onError`. SvelteKit `error()` / `redirect()` are passed
 *      through untouched.
 *
 * @remarks Form-actions only. Because the wrapper unconditionally awaits
 *   `request.formData()`, handlers expecting a non-form body (JSON, etc.)
 *   must use a raw SvelteKit `Action` instead of `defineActions`.
 *
 * @remarks The returned actions preserve each handler's return type so that
 *   `+page.svelte`'s generated `form` typing is precise. Avoid widening it
 *   with an explicit annotation:
 *   - ❌ `export const actions: Actions = defineActions(...)` (widens to `any`)
 *   - ✅ `export const actions = defineActions(...)` (typeof flows to `$types`)
 *   - ✅ `export const actions = defineActions(...) satisfies Actions`
 *
 * @example Minimal create form
 * ```ts
 * export const actions = defineActions({
 *   default: async ({ client, formData, registerValues }) => {
 *     const values = {
 *       name: String(formData.get('name') ?? ''),
 *       email: String(formData.get('email') ?? '')
 *     };
 *     registerValues(values);
 *     const created = await client.post<User>('/users', values);
 *     throw redirect(303, `/users/${created.id}`);
 *   }
 * });
 * ```
 *
 * @example Multiple actions sharing options
 * ```ts
 * export const actions = defineActions(
 *   { http: { timeoutMs: 15_000 } },
 *   {
 *     save: async ({ client, formData, event, registerValues }) => { ... },
 *     delete: async ({ client, event }) => {
 *       await client.delete(`/users/${event.params.id}`);
 *       throw redirect(303, '/users');
 *     }
 *   }
 * );
 * ```
 */
export function defineActions<A extends Record<string, ActionHandler>>(
	handlers: A
): WrappedActions<A>;
export function defineActions<A extends Record<string, ActionHandler>>(
	options: DefineActionsOptions,
	handlers: A
): WrappedActions<A>;
export function defineActions<A extends Record<string, ActionHandler>>(
	optionsOrHandlers: DefineActionsOptions | A,
	maybeHandlers?: A
): WrappedActions<A> {
	const [options, handlers] = normalizeArgs(optionsOrHandlers, maybeHandlers);

	const result = {} as WrappedActions<A>;
	for (const name of Object.keys(handlers) as Array<keyof A & string>) {
		result[name] = wrapAction(handlers[name], options) as WrappedActions<A>[typeof name];
	}
	return result;
}

function wrapAction<H extends ActionHandler>(
	handler: H,
	options: DefineActionsOptions
): WrappedAction<H> {
	return async (event: RequestEvent): Promise<ActionResult<H>> => {
		const client = createAppHttpClient({
			fetch: event.fetch,
			baseURL: options.http?.baseURL ?? event.locals.apiBaseURL,
			cookies: event.cookies,
			timeoutMs: options.http?.timeoutMs
		});
		const formData = await event.request.formData();

		let registeredValues: Record<string, unknown> | undefined;
		const registerValues = (values: Record<string, unknown>): void => {
			registeredValues = values;
		};

		const ctx: ActionContext = { event, client, formData, registerValues };

		try {
			return (await handler(ctx)) as ActionResult<H>;
		} catch (err) {
			if (isKitHttpError(err) || isRedirect(err)) throw err;
			if (options.onError !== undefined) {
				return (await options.onError(err, {
					event,
					formData,
					values: registeredValues
				})) as ActionResult<H>;
			}
			return dispatchActionError(err, { values: registeredValues ?? {} }) as ActionResult<H>;
		}
	};
}

/**
 * Disambiguation is by argument count, not by inspecting key names: with one
 * argument the value is always handlers; options require the two-argument form
 * `defineActions(options, handlers)`. This keeps action names like `http` or
 * `onError` unambiguous and lets the TS overloads carry the contract.
 */
function normalizeArgs<A extends Record<string, ActionHandler>>(
	first: DefineActionsOptions | A,
	second: A | undefined
): [DefineActionsOptions, A] {
	if (second === undefined) return [{}, first as A];
	return [first as DefineActionsOptions, second];
}
