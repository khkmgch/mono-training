<script lang="ts" generics="TRow, S extends SearchParamsSchema = Record<string, never>">
	import type { Snippet } from 'svelte';
	import { navigating } from '$app/state';

	import type { PageResult, SortDirection, SortState } from '$lib/core/list';
	import { Pagination, type PaginationLabels } from '$lib/core/pagination';
	import { Table, type Column } from '$lib/core/table';

	import { getListContext } from '../context';
	import {
		DEFAULT_PAGINATION_LABELS,
		defaultSortAriaLabel,
		formatPaginationSummary
	} from '../default-labels';
	import type { OutOfRangeSnippetContext, SearchParamsSchema } from '../types';
	import DefaultEmpty from './DefaultEmpty.svelte';
	import DefaultOutOfRange from './DefaultOutOfRange.svelte';

	type Props = {
		columns: readonly Column<TRow>[];
		getRowKey: (row: TRow) => string | number;
		/** Visible `<caption>` for the inner `<table>`. Preferred over `ariaLabel` for SR identification. */
		caption?: string;
		/** `aria-label` for the inner `<table>`. Provide at least one of `caption` or `ariaLabel`. */
		ariaLabel?: string;
		empty?: Snippet<[]>;
		noMatch?: Snippet<[]>;
		loadingSnippet?: Snippet<[]>;
		outOfRange?: Snippet<[OutOfRangeSnippetContext]>;
		/** Defaults to `DEFAULT_PAGINATION_LABELS` (paraglide-backed). */
		labels?: PaginationLabels;
		/** When true, $effect auto-navigates (replaceState) to the safe last page. */
		clampOutOfRangePage?: boolean;
		/**
		 * Override `loading`. Default is `navigating.to !== null` — captures every
		 * URL-driven re-load (goto / GET form submit / popstate / `<a>`). Use this
		 * prop when refreshing via `invalidate()` (which does not update `navigating`).
		 */
		loading?: boolean;
		multiSort?: boolean;
		sortAriaLabel?: (col: Column<TRow>, dir: SortDirection | 'none') => string;
		striped?: boolean;
		wrap?: boolean;
	};

	let {
		columns,
		getRowKey,
		caption,
		ariaLabel,
		empty,
		noMatch,
		loadingSnippet,
		outOfRange,
		labels,
		clampOutOfRangePage = false,
		loading: loadingProp,
		multiSort = false,
		sortAriaLabel,
		striped = false,
		wrap = false
	}: Props = $props();

	const ctx = getListContext<S>();

	let nodeEl: HTMLDivElement | undefined = $state(undefined);
	let lastClampedFor: { page: number; totalPages: number } | null = $state(null);

	const result = $derived(ctx.result as unknown as PageResult<TRow>);
	const query = $derived(ctx.query);
	const totalCount = $derived(result.totalCount);
	const totalPages = $derived(result.totalPages);
	const isOutOfRange = $derived(totalCount > 0 && result.page >= totalPages);
	const effectivePage = $derived(isOutOfRange ? Math.max(0, totalPages - 1) : result.page);
	const resolvedLoading = $derived(loadingProp ?? navigating.to !== null);
	const resolvedLabels = $derived(labels ?? DEFAULT_PAGINATION_LABELS);
	const resolvedSortAriaLabel = $derived(sortAriaLabel ?? defaultSortAriaLabel);

	// Build navigate factories once per binding (stable listener identity).
	const navigatePush = $derived(ctx.binding.createNavigate());
	const navigateReplace = $derived(ctx.binding.createNavigate({ replace: true }));

	// 1-based display counts for the pagination summary. The visible row count
	// can be smaller than `result.size` on the last page, so `summaryEnd` reads
	// from `result.items.length` and clamps to `totalCount`.
	const summaryStart = $derived(effectivePage * result.size + 1);
	const summaryEnd = $derived(
		Math.min(effectivePage * result.size + result.items.length, totalCount)
	);
	const showSummary = $derived(totalCount > 0 && !isOutOfRange && result.items.length > 0);

	const hasActiveSearchParams = $derived.by(() => {
		if (query.q !== undefined && query.q !== '') return true;
		for (const value of Object.values(query.searchParams)) {
			if (value === undefined) continue;
			if (Array.isArray(value)) {
				if (value.length > 0) return true;
			} else if (value !== '') {
				return true;
			}
		}
		return false;
	});

	// Spread `query` into every navigation: `toUrlSearchParams` rebuilds owned
	// keys from its argument and drops anything missing, so passing only the
	// changed field would silently wipe active filters.
	function outOfRangeNavigate(nextPage: number): void {
		navigateReplace({ ...query, page: nextPage });
	}

	// Sort change resets to page 0 (new ordering starts at the top).
	function handleSortChange(next: readonly SortState[]): void {
		navigatePush({ ...query, sort: next, page: 0 });
	}

	function handlePageChange(next: number): void {
		navigatePush({ ...query, page: next });
	}

	function buildOutOfRangeContext(): OutOfRangeSnippetContext {
		return {
			page: result.page,
			totalPages,
			clampTo: effectivePage,
			navigate: outOfRangeNavigate
		};
	}

	// Dev guard: DataTable must not be nested inside a <form>.
	$effect(() => {
		if (nodeEl === undefined) return;
		if (nodeEl.closest('form') !== null) {
			console.error(
				'[DataTable] DataTable must be a sibling of <SearchForm>, not nested inside a <form>.'
			);
		}
	});

	// Auto-clamp: replaceState navigate to the safe last page when out-of-range
	// and `clampOutOfRangePage` is enabled. Idempotency guarded by `lastClampedFor`
	// tuple so referential-same result updates (e.g. invalidate) don't re-fire.
	$effect(() => {
		if (!clampOutOfRangePage || !isOutOfRange) return;
		const last = lastClampedFor;
		if (last !== null && last.page === result.page && last.totalPages === totalPages) {
			return;
		}
		lastClampedFor = { page: result.page, totalPages };
		outOfRangeNavigate(effectivePage);
	});
</script>

<div bind:this={nodeEl} class="ds-datatable">
	{#if isOutOfRange}
		{#if outOfRange}
			{@render outOfRange(buildOutOfRangeContext())}
		{:else}
			<DefaultOutOfRange {...buildOutOfRangeContext()} />
		{/if}
	{:else if totalCount === 0 && hasActiveSearchParams}
		{#if noMatch}
			{@render noMatch()}
		{:else if empty}
			{@render empty()}
		{:else}
			<DefaultEmpty />
		{/if}
	{:else if totalCount === 0}
		{#if empty}
			{@render empty()}
		{:else}
			<DefaultEmpty />
		{/if}
	{:else}
		<Table
			rows={result.items}
			{columns}
			{getRowKey}
			{caption}
			{ariaLabel}
			sort={query.sort}
			onSortChange={handleSortChange}
			loading={resolvedLoading}
			{loadingSnippet}
			{multiSort}
			sortAriaLabel={resolvedSortAriaLabel}
			{striped}
			{wrap}
		/>
	{/if}

	{#if totalCount > 0}
		<footer class="ds-datatable-footer">
			{#if showSummary}
				<p class="ds-datatable-summary">
					{formatPaginationSummary({
						start: summaryStart,
						end: summaryEnd,
						total: totalCount
					})}
				</p>
			{/if}
			<Pagination
				page={effectivePage}
				{totalPages}
				onPageChange={handlePageChange}
				labels={resolvedLabels}
				disabled={resolvedLoading}
			/>
		</footer>
	{/if}
</div>

<style>
	/* Adapts to parent height. Constrained parent (inside `.page.list`) →
	 * internal scroll + sticky footer. Content-driven parent → natural flow
	 * + inert sticky header. The viewport-bound decision belongs to
	 * `<Page variant="list">`, not this component. */
	.ds-datatable {
		display: grid;
		grid-template-rows: 1fr auto;
		min-height: 0;
	}

	/* Promote core's wrapper to the single vertical scroll container (it only
	 * declares overflow-x). `min-height: 0` lets the `1fr` row shrink so it
	 * scrolls instead of pushing the page. */
	.ds-datatable :global(.ds-table-wrapper) {
		min-height: 0;
		overflow: auto;
	}

	/* Sticky on each `<th>` (not `<thead>`): pico's `border-collapse: collapse`
	 * makes the spec ignore sticky on `<thead>` / `<tr>`. Inset shadow re-paints
	 * the bottom border that collapse clips from sticky cells on scroll. */
	.ds-datatable :global(.ds-table-wrapper thead th) {
		position: sticky;
		top: 0;
		z-index: 1;
		background: var(--ds-surface-page);
		box-shadow: inset 0 -1px 0 var(--ds-border-strong);
	}

	.ds-datatable-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--ds-space-3);
		margin: 0;
		padding-top: var(--ds-space-3);
		border-top: 1px solid var(--ds-border-subtle);
		background-color: var(--ds-surface-page);
	}

	.ds-datatable-summary {
		margin: 0;
		color: var(--ds-text-muted);
		font-size: var(--ds-fs-small);
	}
</style>
