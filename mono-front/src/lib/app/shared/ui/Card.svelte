<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { children: Snippet };

	let { children }: Props = $props();
</script>

<section class="card">
	{@render children()}
</section>

<style>
	.card {
		padding: var(--ds-space-6);
		background-color: var(--ds-surface-card);
		border: 1px solid var(--ds-border-subtle);
		border-radius: var(--pico-border-radius);
	}
</style>
