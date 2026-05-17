<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PageResult, SortDirection } from '$lib/core/list';
	import {
		DataTable,
		ListProvider,
		type ListBinding,
		type ListQueryWithSearchParams,
		type OutOfRangeSnippetContext
	} from '$lib/app/shared/ui/list';
	import type { Column } from '$lib/core/table';
	import type { PaginationLabels } from '$lib/core/pagination';

	// Row type fixed in the fixture so generic inference for <DataTable> is
	// deterministic from @testing-library/svelte's `render`.
	export type Row = { id: string; name: string };

	type Props = {
		binding: ListBinding<Record<string, never>>;
		query: ListQueryWithSearchParams<Record<string, never>>;
		result: PageResult<Row>;
		columns: readonly Column<Row>[];
		getRowKey: (row: Row) => string | number;
		caption?: string;
		ariaLabel?: string;
		empty?: Snippet<[]>;
		noMatch?: Snippet<[]>;
		loadingSnippet?: Snippet<[]>;
		outOfRange?: Snippet<[OutOfRangeSnippetContext]>;
		labels?: PaginationLabels;
		clampOutOfRangePage?: boolean;
		loading?: boolean;
		multiSort?: boolean;
		sortAriaLabel?: (col: Column<Row>, dir: SortDirection | 'none') => string;
		striped?: boolean;
		wrap?: boolean;
	};

	let p: Props = $props();
</script>

<ListProvider binding={p.binding} query={p.query} result={p.result}>
	<DataTable
		columns={p.columns}
		getRowKey={p.getRowKey}
		caption={p.caption}
		ariaLabel={p.ariaLabel}
		empty={p.empty}
		noMatch={p.noMatch}
		loadingSnippet={p.loadingSnippet}
		outOfRange={p.outOfRange}
		labels={p.labels}
		clampOutOfRangePage={p.clampOutOfRangePage}
		loading={p.loading}
		multiSort={p.multiSort}
		sortAriaLabel={p.sortAriaLabel}
		striped={p.striped}
		wrap={p.wrap}
	/>
</ListProvider>
