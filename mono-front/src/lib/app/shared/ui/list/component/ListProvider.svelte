<script lang="ts" generics="TRow, S extends SearchParamsSchema = Record<string, never>">
	import { setContext, type Snippet } from 'svelte';
	import type { PageResult } from '$lib/core/list';

	import { LIST_CONTEXT_KEY } from '../context';
	import type {
		ListBinding,
		ListContext,
		ListQueryWithSearchParams,
		SearchParamsSchema
	} from '../types';

	type Props = {
		/** The single source of truth — typically created at the feature module's top level. */
		binding: ListBinding<S>;
		/** Parsed query (from `+page.server.ts` load → `binding.parse(event.url)`). */
		query: ListQueryWithSearchParams<S>;
		/** Server result (load failure routes via `+error.svelte`, so this is never absent in the success path). */
		result: PageResult<TRow>;
		children: Snippet<[]>;
	};

	let { binding, query, result, children }: Props = $props();

	// Getter-context pattern (Svelte 5 official). Each access reads the latest
	// prop, so navigation → load → ListProvider props update → child reads via
	// getListContext() see the new values without an extra $derived.
	const ctx: ListContext<S> = {
		get binding() {
			return binding;
		},
		get query() {
			return query;
		},
		get result() {
			return result as PageResult<unknown>;
		}
	};
	setContext(LIST_CONTEXT_KEY, ctx);
</script>

{@render children()}
