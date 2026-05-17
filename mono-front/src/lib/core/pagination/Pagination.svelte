<script lang="ts">
	import { computePageWindow } from '$lib/core/list';
	import type { PaginationLabels } from './types';

	type Props = {
		/** 0-based current page. May exceed `totalPages - 1` (out-of-range echo). */
		page: number;
		totalPages: number;
		/** Receives a 0-based page index. No DOM event is forwarded. */
		onPageChange: (nextPage: number) => void;
		labels: PaginationLabels;
		siblings?: number;
		boundary?: number;
		/** When true, every button is disabled (e.g., during navigation). */
		disabled?: boolean;
	};

	let {
		page,
		totalPages,
		onPageChange,
		labels,
		siblings = 1,
		boundary = 1,
		disabled = false
	}: Props = $props();

	const pageWindow = $derived(computePageWindow(page, totalPages, { siblings, boundary }));
	const prevDisabled = $derived(disabled || page <= 0);
	const nextDisabled = $derived(disabled || page >= totalPages - 1);

	function pageAriaLabel(displayNumber: number): string {
		return labels.page?.(displayNumber) ?? `Go to page ${displayNumber}`;
	}
</script>

<nav aria-label={labels.nav}>
	<ul class="ds-pagination">
		<li>
			<button type="button" disabled={prevDisabled} onclick={() => onPageChange(page - 1)}>
				{labels.previousPage}
			</button>
		</li>

		{#each pageWindow as item, index (typeof item === 'number' ? `p-${item}` : `e-${index}`)}
			{#if item === 'ellipsis'}
				<li class="ds-pagination-ellipsis" aria-hidden="true">…</li>
			{:else}
				<li>
					<button
						type="button"
						aria-current={item === page ? 'page' : undefined}
						aria-label={pageAriaLabel(item + 1)}
						{disabled}
						onclick={() => onPageChange(item)}
					>
						{item + 1}
					</button>
				</li>
			{/if}
		{/each}

		<li>
			<button type="button" disabled={nextDisabled} onclick={() => onPageChange(page + 1)}>
				{labels.nextPage}
			</button>
		</li>
	</ul>
</nav>

<style>
	.ds-pagination {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.ds-pagination button {
		min-width: 2.5rem;
	}

	.ds-pagination button[aria-current='page'] {
		background: var(--ds-pagination-current-bg, transparent);
		font-weight: 600;
	}

	.ds-pagination button:focus-visible {
		outline: 2px solid;
		outline-offset: 2px;
	}

	.ds-pagination-ellipsis {
		display: flex;
		align-items: center;
		padding: 0 0.5rem;
	}
</style>
