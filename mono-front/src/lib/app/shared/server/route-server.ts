import type { ActionFailure, RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { defineActions as defineActionsImpl } from './define-actions';
import { defineLoad as defineLoadImpl } from './define-load';
import type { ActionHandler, DefineActionsOptions, DefineLoadOptions, LoadHandler } from './types';

type WrappedActionsFor<E extends RequestEvent, A> = {
	[K in keyof A]: A[K] extends ActionHandler<E, infer R>
		? (event: E) => Promise<Awaited<R> | ActionFailure<{ error: App.Error }>>
		: never;
};

interface DefineLoadFor<E extends ServerLoadEvent> {
	<R>(handler: LoadHandler<E, R>): (event: E) => Promise<R>;
	<R>(options: DefineLoadOptions<E>, handler: LoadHandler<E, R>): (event: E) => Promise<R>;
}

interface DefineActionsFor<E extends RequestEvent> {
	<A extends Record<string, ActionHandler<E, unknown>>>(handlers: A): WrappedActionsFor<E, A>;
	<A extends Record<string, ActionHandler<E, unknown>>>(
		options: DefineActionsOptions,
		handlers: A
	): WrappedActionsFor<E, A>;
}

/**
 * Route-narrowed pair of `defineLoad` and `defineActions` returned by
 * {@link routeServer}.
 */
export interface RouteServer<
	LoadEvent extends ServerLoadEvent = ServerLoadEvent,
	ActionEvent extends RequestEvent = RequestEvent
> {
	defineLoad: DefineLoadFor<LoadEvent>;
	defineActions: DefineActionsFor<ActionEvent>;
}

/**
 * Build route-narrowed `defineLoad` and `defineActions` helpers from the
 * generated `./$types` event types. The returned helpers narrow `event.params`
 * and related route-specific fields so handlers can omit per-parameter type
 * annotations entirely.
 *
 * @remarks Pass both `PageServerLoadEvent` (or `LayoutServerLoadEvent`) and
 *   `RequestEvent` as explicit type arguments — `./$types` is a `.d.ts`
 *   module, so the event types cannot be inferred via
 *   `typeof import('./$types')`.
 *
 * @example
 * ```ts
 * import { routeServer, getString, getNumber } from '$lib/app/shared/server';
 * import type { Actions, PageServerLoad, PageServerLoadEvent, RequestEvent } from './$types';
 *
 * const { defineLoad, defineActions } = routeServer<PageServerLoadEvent, RequestEvent>();
 *
 * export const load = defineLoad(async ({ event, client }) => ({
 *   user: await fetchUser(client, event.params.id)   // event.params.id: string
 * })) satisfies PageServerLoad;
 *
 * export const actions = defineActions({
 *   save: async ({ event, client, formData }) => {
 *     await updateUser(client, event.params.id, {
 *       name: getString(formData, 'name')
 *     });
 *   }
 * }) satisfies Actions;
 * ```
 */
export function routeServer<
	LoadEvent extends ServerLoadEvent = ServerLoadEvent,
	ActionEvent extends RequestEvent = RequestEvent
>(): RouteServer<LoadEvent, ActionEvent> {
	return {
		defineLoad: defineLoadImpl,
		defineActions: defineActionsImpl
	};
}
