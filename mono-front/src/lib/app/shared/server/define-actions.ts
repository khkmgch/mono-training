import {
	isHttpError as isKitHttpError,
	isRedirect,
	type ActionFailure,
	type RequestEvent
} from '@sveltejs/kit';
import { dispatchActionError } from '../error';
import { createAppHttpClient } from '../http';
import type { ActionContext, ActionHandler, DefineActionsOptions } from './types';

// Wide constraint for the annotated-handler overload: `ctx: never` accepts any
// `ActionContext<E>`, letting per-route `RequestEvent` narrowing flow through
// while the strict overload below preserves contextual typing for unannotated
// handlers.
type AnyHandler = (ctx: never) => unknown | Promise<unknown>;

type EventOf<H> = H extends (ctx: { event: infer E }) => unknown | Promise<unknown>
	? E extends RequestEvent
		? E
		: RequestEvent
	: RequestEvent;

type WrappedAction<H> = H extends (ctx: never) => infer R
	? (event: EventOf<H>) => Promise<Awaited<R> | ActionFailure<{ error: App.Error }>>
	: never;

type WrappedActions<A extends Record<string, AnyHandler>> = {
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
 * @remarks To narrow `event.params` per route, annotate the destructured
 *   handler parameter with `ActionContext<RequestEvent>` where `RequestEvent`
 *   is imported from generated `./$types`. The wrapper preserves the
 *   per-handler event type so `$types`-driven `form` inference stays precise.
 *
 * @example Minimal create form (no annotation — broad event)
 * ```ts
 * export const actions = defineActions({
 *   default: async ({ client, formData, registerValues }) => {
 *     const values = {
 *       name: getString(formData, 'name'),
 *       email: getString(formData, 'email')
 *     };
 *     registerValues(values);
 *     const created = await client.post<User>('/users', values);
 *     throw redirect(303, `/users/${created.id}`);
 *   }
 * });
 * ```
 *
 * @example Route-narrowed params (recommended for `[param]` routes)
 * ```ts
 * import type { Actions, RequestEvent } from './$types';
 * import type { ActionContext } from '$lib/app/shared/server';
 *
 * type ActionCtx = ActionContext<RequestEvent>;
 *
 * export const actions = defineActions({
 *   save: async ({ client, formData, event }: ActionCtx) => {
 *     await client.put(`/users/${event.params.id}`, ...);
 *   },
 *   delete: async ({ client, event }: ActionCtx) => {
 *     await client.delete(`/users/${event.params.id}`);
 *   }
 * }) satisfies Actions;
 * ```
 */
// Overload 1: no annotation — `ctx` is contextually typed.
export function defineActions<A extends Record<string, ActionHandler<RequestEvent, unknown>>>(
	handlers: A
): WrappedActions<A>;
export function defineActions<A extends Record<string, ActionHandler<RequestEvent, unknown>>>(
	options: DefineActionsOptions,
	handlers: A
): WrappedActions<A>;
// Overload 2: annotated handler — wide contravariant constraint.
export function defineActions<A extends Record<string, AnyHandler>>(handlers: A): WrappedActions<A>;
export function defineActions<A extends Record<string, AnyHandler>>(
	options: DefineActionsOptions,
	handlers: A
): WrappedActions<A>;
export function defineActions<A extends Record<string, AnyHandler>>(
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

function wrapAction(
	handler: AnyHandler,
	options: DefineActionsOptions
): (event: RequestEvent) => Promise<unknown> {
	return async (event: RequestEvent): Promise<unknown> => {
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
			return await (handler as (ctx: ActionContext) => unknown | Promise<unknown>)(ctx);
		} catch (err) {
			if (isKitHttpError(err) || isRedirect(err)) throw err;
			if (options.onError !== undefined) {
				return await options.onError(err, {
					event,
					formData,
					values: registeredValues
				});
			}
			return dispatchActionError(err, { values: registeredValues ?? {} });
		}
	};
}

/**
 * Disambiguation is by argument count, not by inspecting key names: with one
 * argument the value is always handlers; options require the two-argument form
 * `defineActions(options, handlers)`. This keeps action names like `http` or
 * `onError` unambiguous and lets the TS overloads carry the contract.
 */
function normalizeArgs<A extends Record<string, AnyHandler>>(
	first: DefineActionsOptions | A,
	second: A | undefined
): [DefineActionsOptions, A] {
	if (second === undefined) return [{}, first as A];
	return [first as DefineActionsOptions, second];
}
