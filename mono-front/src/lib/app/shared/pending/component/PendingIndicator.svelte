<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import { getPendingContext } from '../context.svelte';

	type Props = {
		/** Custom indicator. The `isVisible` boolean is forwarded for conditional rendering. */
		children?: Snippet<[isVisible: boolean]>;
	};

	let { children }: Props = $props();

	const pending = getPendingContext();
</script>

{#if children}
	{@render children(pending.visible)}
{:else}
	<progress
		class="pending-indicator"
		class:visible={pending.visible}
		aria-label={m.shared_pending_indicator_label()}
		aria-hidden={pending.visible ? undefined : 'true'}
	></progress>
{/if}

<style>
	.pending-indicator {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		width: 100%;
		height: 3px;
		margin: 0;
		border: 0;
		border-radius: 0;
		z-index: var(--ds-z-pending-indicator);
		visibility: hidden;
		pointer-events: none;
	}

	.pending-indicator.visible {
		visibility: visible;
	}
</style>
