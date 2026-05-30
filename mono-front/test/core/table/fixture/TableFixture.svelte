<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SortDirection, SortState } from '$lib/core/list';
	import { Table, type Column } from '$lib/core/table';

	// Row type is fixed in the fixture so generic inference for <Table> is
	// deterministic when @testing-library/svelte's `render` is called from a test.
	export type Row = { id: string; name: string; age: number | null };

	type Props = {
		rows: readonly Row[];
		columns: readonly Column<Row>[];
		getRowKey: (row: Row) => string | number;
		sort?: readonly SortState[];
		onSortChange?: (next: readonly SortState[]) => void;
		loading?: boolean;
		caption?: string;
		ariaLabel?: string;
		striped?: boolean;
		wrap?: boolean;
		sortAriaLabel?: (col: Column<Row>, dir: SortDirection | 'none') => string;
		empty?: Snippet<[]>;
		noMatch?: Snippet<[]>;
		loadingSnippet?: Snippet<[]>;
		multiSort?: boolean;
		tooltip?: boolean;
	};

	let p: Props = $props();
</script>

<Table {...p} />
