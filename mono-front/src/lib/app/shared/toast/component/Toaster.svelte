<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { getToastContext } from '../context';

	const toasts = getToastContext();
</script>

<div class="toaster" role="status" aria-live="polite" aria-atomic="false">
	{#each toasts.items as toast (toast.id)}
		<article class="toast toast-{toast.type}">
			<div class="toast-body">
				<p class="toast-message">{toast.message}</p>
				{#if toast.detail !== undefined}
					<small class="toast-detail">{toast.detail}</small>
				{/if}
			</div>
			<button
				type="button"
				class="toast-dismiss"
				onclick={() => toasts.dismiss(toast.id)}
				aria-label={m.shared_toast_dismiss_label()}
			>
				&times;
			</button>
		</article>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: var(--z-toaster, 200);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: min(360px, calc(100vw - 2rem));
		pointer-events: none;
	}

	.toast {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: start;
		gap: 0.75rem;
		margin: 0;
		padding: 0.75rem 1rem;
		background-color: var(--pico-card-background-color, white);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
		pointer-events: auto;
	}

	.toast-success {
		border-left: 4px solid var(--pico-color-green-500, #16a34a);
	}

	.toast-error {
		border-left: 4px solid var(--pico-color-red-600, #dc2626);
	}

	.toast-info {
		border-left: 4px solid var(--pico-color-blue-500, #2563eb);
	}

	.toast-message {
		margin: 0;
	}

	.toast-detail {
		display: block;
		margin-top: 0.25rem;
		opacity: 0.7;
	}

	.toast-dismiss {
		background: transparent;
		border: 0;
		padding: 0 0.25rem;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		color: inherit;
	}
</style>
