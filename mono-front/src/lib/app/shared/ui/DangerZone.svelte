<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/** Inline warning text rendered to the left of the action slot. */
		description: string;
		/** Accessible name — caller-provided to keep this component domain-agnostic. */
		ariaLabel: string;
		children: Snippet;
	};

	let { description, ariaLabel, children }: Props = $props();
</script>

<!-- Card carries destructive context → button uses outline-red (avoid double-red filled). -->
<section class="danger-zone" aria-label={ariaLabel}>
	<span>{description}</span>
	{@render children()}
</section>

<style>
	.danger-zone {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--ds-space-3);
		padding: var(--ds-space-6);
		background-color: color-mix(in srgb, var(--ds-color-error) 5%, var(--ds-surface-card));
		border: 1px solid color-mix(in srgb, var(--ds-color-error) 40%, var(--ds-border-subtle));
		border-radius: var(--pico-border-radius);
		color: var(--ds-text-muted);
		font-size: var(--ds-fs-small);
	}

	/* Outline-red button for the inline destructive action. `:global` because
	 * the button is rendered by the consumer (e.g. <DeleteUserForm>) in its
	 * own scope. Hover inverts to filled-red (industry-standard interaction). */
	.danger-zone :global(button) {
		width: auto;
		margin: 0;
		color: var(--ds-color-error);
		background-color: transparent;
		border-color: var(--ds-color-error);
		white-space: nowrap;
	}

	.danger-zone :global(button:hover) {
		color: #fff;
		background-color: var(--ds-color-error);
	}
</style>
