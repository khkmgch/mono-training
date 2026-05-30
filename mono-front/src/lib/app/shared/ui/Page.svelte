<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/**
		 * Layout variant.
		 * - `default`: standard page (wide content, gap-6)
		 * - `list`:    viewport-bound search/list screens; reverts to page-level scroll on phones (≤ 575px)
		 * - `detail`:  single-record edit/view screens (640 px max-width)
		 */
		variant?: 'default' | 'list' | 'detail';
		children: Snippet;
	};

	let { variant = 'default', children }: Props = $props();
</script>

<div class="page" class:list={variant === 'list'} class:detail={variant === 'detail'}>
	{@render children()}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--ds-space-6);
		max-width: var(--ds-layout-max-w);
		margin: 0 auto;
		padding: 0 var(--ds-space-4);
	}

	/* Viewport-bound list: `height: 100%` receives the remaining height from
	 * `.app-shell:has(.page.list) .app-main` (app.css) — no fixed-value
	 * arithmetic against real header / border heights. Phones revert to
	 * page-level scroll to avoid nested touch scroll containers. */
	.page.list {
		gap: var(--ds-space-3);
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	/* The last child (DataTable) is injected via children() — `:global` keeps
	 * Svelte from dropping the selector as "unused" and silently breaking the
	 * height chain. */
	.page.list > :global(:last-child) {
		flex: 1;
		min-height: 0;
	}

	@media (max-width: 575px) {
		.page.list {
			height: auto;
			overflow: visible;
		}
		.page.list > :global(:last-child) {
			flex: 0 1 auto;
		}
	}

	.page.detail {
		max-width: var(--ds-layout-detail-max-w);
		gap: var(--ds-space-4);
	}
</style>
