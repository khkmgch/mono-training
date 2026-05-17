import { getContext } from 'svelte';
import type { ListContext, SearchParamsSchema } from './types';

/**
 * Internal Symbol used as the Svelte context key. Exposed so `<ListProvider>`
 * can call `setContext(LIST_CONTEXT_KEY, ...)` directly.
 */
export const LIST_CONTEXT_KEY: unique symbol = Symbol('list-context');

/**
 * Read {@link ListContext} from the nearest enclosing `<ListProvider>`. The
 * returned object exposes `binding` / `query` / `result` as **reactive getters**
 * — reading them inside a reactive scope (`$derived` / `$effect` / template)
 * re-evaluates on the provider's prop updates without any extra `$derived` at
 * the call site.
 *
 * @throws Error when called outside any `<ListProvider>` scope. The thrown
 *   error message is the dev guardrail for misuse (e.g. placing `<DataTable>`
 *   outside the provider).
 */
export function getListContext<S extends SearchParamsSchema>(): ListContext<S> {
	const ctx = getContext<ListContext<S> | undefined>(LIST_CONTEXT_KEY);
	if (ctx === undefined) {
		throw new Error('getListContext: must be called within a <ListProvider>.');
	}
	return ctx;
}
