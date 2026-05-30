<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	export type BreadcrumbItem = {
		label: string;
		/** Omit on the last item — that item is rendered as the current page. */
		href?: string;
	};

	type Props = {
		items: ReadonlyArray<BreadcrumbItem>;
		/** Override the `<nav>` accessible name; defaults to the shared label key. */
		ariaLabel?: string;
	};

	let { items, ariaLabel = m.app_nav_breadcrumb_label() }: Props = $props();
</script>

<nav aria-label={ariaLabel} class="breadcrumb">
	<ol>
		{#each items as item, i (i)}
			{@const isLast = i === items.length - 1}
			<li aria-current={isLast ? 'page' : undefined}>
				{#if item.href !== undefined && !isLast}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is supplied by the caller already resolved via $app/paths.resolve -->
					<a href={item.href}>{item.label}</a>
				{:else}
					{item.label}
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.breadcrumb ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ds-space-2);
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--ds-text-muted);
		font-size: var(--ds-fs-small);
	}

	.breadcrumb li:not(:last-child)::after {
		content: '/';
		margin-left: var(--ds-space-2);
		opacity: 0.5;
	}

	.breadcrumb [aria-current='page'] {
		color: var(--ds-text-primary);
	}
</style>
