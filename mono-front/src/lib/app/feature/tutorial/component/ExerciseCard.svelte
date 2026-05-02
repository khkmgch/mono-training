<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		docUrl?: string;
		children: Snippet;
	}

	let { title, docUrl, children }: Props = $props();

	let resetKey = $state(0);
</script>

<article>
	<header class="card-header">
		<h3>{title}</h3>
		<div class="card-actions">
			{#if docUrl}
				<a
					href={docUrl}
					target="_blank"
					rel="external noopener noreferrer"
					aria-label="Open official tutorial page (opens in new tab)"
				>
					&#8599;
				</a>
			{/if}
			<button onclick={() => resetKey++} aria-label="Reset exercise"> &#8634; </button>
		</div>
	</header>
	<div class="card-body">
		{#key resetKey}
			{@render children()}
		{/key}
	</div>
</article>

<style>
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-header h3 {
		margin: 0;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.card-actions :is(a, button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		font-size: 1.125rem;
		color: inherit;
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: none;
	}

	.card-actions :is(a:hover, button:hover, button:focus-visible) {
		color: var(--pico-primary);
	}

	.card-body {
		padding: 0.5rem;
		overflow-x: auto;
	}
</style>
