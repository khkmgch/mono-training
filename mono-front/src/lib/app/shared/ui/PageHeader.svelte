<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		/** Right-aligned slot (action button, meta subtitle, etc.). */
		end?: Snippet;
	};

	let { title, end }: Props = $props();
</script>

<header class="page-header">
	<h1>{title}</h1>
	{#if end !== undefined}
		{@render end()}
	{/if}
</header>

<style>
	.page-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--ds-space-3);
	}

	.page-header h1 {
		margin: 0;
		font-size: var(--ds-fs-h1);
		line-height: var(--ds-lh-tight);
	}
</style>
