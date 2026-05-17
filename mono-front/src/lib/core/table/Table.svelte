<script lang="ts" generics="TRow">
	import type { Snippet } from 'svelte';
	import {
		nextSortState,
		renderCellValue,
		type SortDirection,
		type SortState
	} from '$lib/core/list';
	import type { Column } from './types';

	type Props = {
		rows: readonly TRow[];
		columns: readonly Column<TRow>[];
		/**
		 * Extract a stable unique key per row. Required for correct `{#each}` keying;
		 * use row identity (e.g. `row.id`) — index-based keying defeats the purpose.
		 */
		getRowKey: (row: TRow) => string | number;
		sort?: readonly SortState[];
		/**
		 * Called when the user requests a sort change. `next` is already computed via
		 * `nextSortState` — DOM events are intentionally not forwarded.
		 */
		onSortChange?: (next: readonly SortState[]) => void;
		loading?: boolean;
		/** Visible `<caption>`. Takes precedence over `ariaLabel` for SR identification. */
		caption?: string;
		ariaLabel?: string;
		/** Adds `.striped` class hook; requires `.striped` CSS (Pico CSS 2.x provides it). */
		striped?: boolean;
		/** When true, cells wrap to multiple lines instead of being truncated with ellipsis. */
		wrap?: boolean;
		/**
		 * Override the SR aria-label of the sort button. Defaults to
		 * `Sort by ${col.label ?? col.header}, ${dir}` (core has no i18n; app/shared
		 * layers a paraglide-backed default on top).
		 */
		sortAriaLabel?: (col: Column<TRow>, dir: SortDirection | 'none') => string;
		empty?: Snippet<[]>;
		/** Fallback for `rows.length === 0` after a filtered search. Falls back to `empty`. */
		noMatch?: Snippet<[]>;
		/** Rendered when `loading && rows.length === 0`. Absent → only `aria-busy` is set. */
		loadingSnippet?: Snippet<[]>;
		/** Opt-in: Shift+click adds/cycles a sort entry. Plain click still single-resets. */
		multiSort?: boolean;
	};

	let {
		rows,
		columns,
		getRowKey,
		sort = [],
		onSortChange,
		loading = false,
		caption,
		ariaLabel,
		striped = false,
		wrap = false,
		sortAriaLabel,
		empty,
		noMatch,
		loadingSnippet,
		multiSort = false
	}: Props = $props();

	const hasAnyWidth = $derived(columns.some((c) => c.width !== undefined));
	const sortIndex = $derived(new Map(sort.map((entry) => [entry.field, entry.direction])));

	function sortKeyOf(column: Column<TRow>): string {
		return column.sortKey ?? column.id;
	}

	function getSortDirection(column: Column<TRow>): SortDirection | 'none' {
		return sortIndex.get(sortKeyOf(column)) ?? 'none';
	}

	function ariaSortValue(direction: SortDirection | 'none'): 'ascending' | 'descending' | 'none' {
		if (direction === 'asc') return 'ascending';
		if (direction === 'desc') return 'descending';
		return 'none';
	}

	function fallbackSortAriaLabel(column: Column<TRow>, direction: SortDirection | 'none'): string {
		const columnLabel =
			column.label ?? (typeof column.header === 'string' ? column.header : column.id);
		return `Sort by ${columnLabel}, ${direction}`;
	}

	function handleSortClick(column: Column<TRow>, event: MouseEvent): void {
		if (column.sortable !== true) return;
		const multi = multiSort && event.shiftKey;
		const next = nextSortState(sort, sortKeyOf(column), { multi });
		onSortChange?.(next);
	}

	function normalizeWidth(value: string | number | undefined): string | undefined {
		if (value === undefined) return undefined;
		return typeof value === 'number' ? `${value}px` : value;
	}

	function readAccessor(row: TRow, column: Column<TRow>): unknown {
		return column.accessor ? column.accessor(row) : undefined;
	}

	$effect(() => {
		if (caption === undefined && ariaLabel === undefined) {
			console.warn('[core/table] Either `caption` or `ariaLabel` is required for accessibility.');
		}
		for (const column of columns) {
			if (typeof column.header !== 'string' && column.label === undefined) {
				console.warn(
					`[core/table] Column "${column.id}" uses a Snippet header but has no \`label\`. Sort aria-label falls back to the column id.`
				);
			}
		}
		// Duplicate `column.id` is enforced by Svelte's `{#each ... (key)}` runtime
		// invariant — it throws `each_key_duplicate` in dev mode before `$effect`
		// runs, so we don't re-implement the check here.
	});
</script>

<div class="ds-table-wrapper">
	<table
		aria-busy={loading}
		aria-label={ariaLabel}
		class:fixed={hasAnyWidth}
		class:striped
		class:wrap
	>
		{#if caption !== undefined}<caption>{caption}</caption>{/if}
		<colgroup>
			{#each columns as col (col.id)}
				<col style:width={normalizeWidth(col.width)} />
			{/each}
		</colgroup>
		<thead>
			<tr>
				{#each columns as col (col.id)}
					{@const direction = getSortDirection(col)}
					{@const ariaSort = ariaSortValue(direction)}
					{@const sortLabelText = (sortAriaLabel ?? fallbackSortAriaLabel)(col, direction)}
					<th scope="col" aria-sort={ariaSort} class={col.headerClass}>
						{#if col.sortable === true}
							<button
								type="button"
								class="ds-sort-button"
								aria-label={sortLabelText}
								onclick={(event) => handleSortClick(col, event)}
							>
								{#if typeof col.header === 'string'}
									{col.header}
								{:else}
									{@render col.header()}
								{/if}
								<span class="ds-sort-indicator" aria-hidden="true">
									{#if direction === 'asc'}↑{:else if direction === 'desc'}↓{:else}↕{/if}
								</span>
							</button>
						{:else if typeof col.header === 'string'}
							{col.header}
						{:else}
							{@render col.header()}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if rows.length === 0}
				{#if loading && loadingSnippet}
					<tr>
						<td colspan={columns.length}>
							{@render loadingSnippet()}
						</td>
					</tr>
				{:else if !loading && noMatch}
					<tr>
						<td colspan={columns.length}>
							{@render noMatch()}
						</td>
					</tr>
				{:else if !loading && empty}
					<tr>
						<td colspan={columns.length}>
							{@render empty()}
						</td>
					</tr>
				{/if}
			{:else}
				{#each rows as row, index (getRowKey(row))}
					<tr>
						{#each columns as col (col.id)}
							{@const value = readAccessor(row, col)}
							<td class={col.cellClass}>
								{#if col.cell}
									{@render col.cell({ row, column: col, value, index })}
								{:else}
									{renderCellValue(value)}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.ds-table-wrapper {
		overflow-x: auto;
	}

	table.fixed {
		table-layout: fixed;
	}

	table.wrap td {
		white-space: normal;
		overflow-wrap: break-word;
	}

	table:not(.wrap).fixed td {
		max-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	th[aria-sort='ascending'],
	th[aria-sort='descending'] {
		background: var(--ds-table-sort-active-bg, transparent);
	}

	.ds-sort-button {
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: inherit;
		text-align: inherit;
		cursor: pointer;
		display: inline-flex;
		gap: 0.5ch;
		align-items: center;
	}

	.ds-sort-button:focus-visible {
		outline: 2px solid;
		outline-offset: 2px;
	}

	.ds-sort-indicator {
		font-size: 0.85em;
		opacity: 0.6;
	}
</style>
