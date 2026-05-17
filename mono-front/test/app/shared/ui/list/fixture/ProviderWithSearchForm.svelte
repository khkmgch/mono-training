<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PageResult } from '$lib/core/list';
	import {
		ListProvider,
		SearchForm,
		type ListBinding,
		type ListQueryWithSearchParams,
		type SearchControlsContext
	} from '$lib/app/shared/ui/list';

	// Schema is fixed in the fixture so generic inference for <SearchForm> is
	// deterministic when @testing-library/svelte's `render` is called from a test.
	export type FixtureSchema = { readonly status: 'string' };

	type Props = {
		binding: ListBinding<FixtureSchema>;
		query: ListQueryWithSearchParams<FixtureSchema>;
		result: PageResult<unknown>;
		'aria-label'?: string;
		'aria-labelledby'?: string;
		searchElement?: 'search' | 'div';
		searchControls: Snippet<[SearchControlsContext<FixtureSchema>]>;
	};

	let p: Props = $props();
</script>

<ListProvider binding={p.binding} query={p.query} result={p.result}>
	<SearchForm
		aria-label={p['aria-label']}
		aria-labelledby={p['aria-labelledby']}
		searchElement={p.searchElement}
		searchControls={p.searchControls}
	/>
</ListProvider>
