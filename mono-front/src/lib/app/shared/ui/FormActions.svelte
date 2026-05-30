<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { children: Snippet };

	let { children }: Props = $props();
</script>

<!-- DOM order: Cancel BEFORE Submit so Tab/SR reaches the escape hatch
	first (visual right-align is cosmetic). -->
<div class="form-actions">
	{@render children()}
</div>

<style>
	.form-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: var(--ds-space-3);
		margin-top: var(--ds-space-2);
	}

	/* Pico defaults `button[type=submit] { width: 100% }` for mobile-first
	 * stacking. Override so action-row controls size to content. `:global` is
	 * required because the actual buttons live inside the consumer's snippet
	 * (a different scope). */
	.form-actions :global(button),
	.form-actions :global(a[role='button']) {
		width: auto;
		margin: 0;
		white-space: nowrap;
	}
</style>
