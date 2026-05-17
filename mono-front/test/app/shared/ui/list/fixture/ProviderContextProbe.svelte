<script lang="ts">
	import type { PageResult } from '$lib/core/list';
	import {
		ListProvider,
		getListContext,
		type ListBinding,
		type ListQueryWithSearchParams
	} from '$lib/app/shared/ui/list';

	// Schema fixed in the fixture so generic inference is deterministic.
	export type FixtureSchema = { readonly status: 'string' };

	type Props = {
		binding: ListBinding<FixtureSchema>;
		query: ListQueryWithSearchParams<FixtureSchema>;
		result: PageResult<unknown>;
	};

	let { binding, query, result }: Props = $props();
</script>

<ListProvider {binding} {query} {result}>
	{@const ctx = getListContext<FixtureSchema>()}
	<span data-testid="probe-root">
		<span data-testid="probe-q">{ctx.query.q ?? ''}</span>
		<span data-testid="probe-status">{ctx.query.searchParams.status ?? ''}</span>
		<span data-testid="probe-totalCount">{ctx.result.totalCount}</span>
	</span>
</ListProvider>
