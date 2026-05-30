/**
 * Server-only helpers for SvelteKit `+page.server.ts` / `+layout.server.ts`.
 *
 * @remarks Importing from a browser context (e.g. `+page.svelte`) is not
 *   supported — the wrappers depend on `event.locals` / `event.cookies`,
 *   which only exist on the server.
 *
 * @remarks Requires `App.Locals.apiBaseURL: string` (declared in `src/app.d.ts`)
 *   and a server `handle` hook that populates it. The wrappers read this value
 *   to construct the per-request HTTP client; absence is a compile-time error.
 *   Per-call `options.http.baseURL` overrides it.
 *
 * @remarks To narrow `event.params` per route without annotating every
 *   handler, use {@link routeServer} with the `PageServerLoadEvent` /
 *   `RequestEvent` types from `./$types`. The bare `defineLoad` /
 *   `defineActions` exports use the broad event types and remain available.
 */

export type {
	ActionContext,
	ActionHandler,
	DefineActionsOptions,
	DefineHttpOptions,
	DefineLoadOptions,
	LoadHandler,
	ServerLoadContext
} from './types';
export { defineLoad } from './define-load';
export { defineActions } from './define-actions';
export { routeServer, type RouteServer } from './route-server';
export { getString, getNumber } from './form-data';
