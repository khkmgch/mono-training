<script lang="ts" generics="TRow, S extends SearchParamsSchema = Record<string, never>">
	import type { Snippet } from 'svelte';
	import { navigating } from '$app/state';

	import type { PageResult, SortDirection, SortState } from '$lib/core/list';
	import { Pagination, type PaginationLabels } from '$lib/core/pagination';
	import { Table, type Column } from '$lib/core/table';

	import { getListContext } from '../context';
	import { DEFAULT_PAGINATION_LABELS, defaultSortAriaLabel } from '../default-labels';
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

	// Navigate factories built once per binding — see `createNavigate` JSDoc
	// "Call this factory once at the consumer's `<script>` top-level and reuse
	// the returned function for stable DOM listener identity".
	const navigatePush = $derived(ctx.binding.createNavigate());
	const navigateReplace = $derived(ctx.binding.createNavigate({ replace: true }));

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

	function outOfRangeNavigate(nextPage: number): void {
		navigateReplace({ page: nextPage });
	}

	function handleSortChange(next: readonly SortState[]): void {
		navigatePush({ sort: next });
	}

	function handlePageChange(next: number): void {
		navigatePush({ page: next });
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
		<Pagination
			page={effectivePage}
			{totalPages}
			onPageChange={handlePageChange}
			labels={resolvedLabels}
			disabled={resolvedLoading}
		/>
	{/if}
</div>

<style>
	.ds-datatable {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
