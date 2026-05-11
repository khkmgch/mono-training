<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import { getConfirmContext } from '../context';
	import type { ConfirmIntent } from '../types';

	type Props = {
		/**
		 * Custom dialog body. When omitted, the standard pico card with
		 * cancel / confirm buttons is rendered.
		 */
		children?: Snippet<[intent: ConfirmIntent, resolve: (answer: boolean) => void]>;
	};

	let { children }: Props = $props();

	const confirmState = getConfirmContext();
	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		const intent = confirmState.intent;
		if (intent === null) {
			if (dialog?.open === true) dialog.close();
			return;
		}
		if (dialog !== undefined && dialog.open === false) {
			dialog.showModal();
		}
	});

	function handleClose(): void {
		const value = dialog?.returnValue ?? '';
		if (dialog !== undefined) dialog.returnValue = '';
		confirmState.resolve(value === 'confirm');
	}
</script>

{#if confirmState.intent !== null}
	{@const intent = confirmState.intent}
	<dialog
		bind:this={dialog}
		role={intent.destructive === true ? 'alertdialog' : 'dialog'}
		aria-labelledby="confirm-title"
		aria-describedby="confirm-message"
		onclose={handleClose}
	>
		{#if children}
			{@render children(intent, (answer) => confirmState.resolve(answer))}
		{:else}
			<article class="confirm-card">
				<header>
					<h3 id="confirm-title">{intent.title}</h3>
				</header>
				<p id="confirm-message">{intent.message}</p>
				{#if intent.detail !== undefined}
					<small class="confirm-detail">{intent.detail}</small>
				{/if}
				<footer>
					<form method="dialog" class="confirm-actions">
						{#if intent.destructive === true}
							<!--
								destructive flow: focus cancel so the dangerous default cannot be triggered
								by Enter/Space alone (WAI-ARIA APG alertdialog).
							-->
							<!-- svelte-ignore a11y_autofocus -->
							<button type="submit" value="cancel" class="secondary" autofocus>
								{intent.cancelLabel ?? m.term_action_cancel()}
							</button>
							<button type="submit" value="confirm" class="contrast">
								{intent.confirmLabel ?? m.term_action_confirm()}
							</button>
						{:else}
							<button type="submit" value="cancel" class="secondary">
								{intent.cancelLabel ?? m.term_action_cancel()}
							</button>
							<!-- non-destructive: focus confirm so Enter resolves the dialog. -->
							<!-- svelte-ignore a11y_autofocus -->
							<button type="submit" value="confirm" autofocus>
								{intent.confirmLabel ?? m.term_action_confirm()}
							</button>
						{/if}
					</form>
				</footer>
			</article>
		{/if}
	</dialog>
{/if}

<style>
	dialog {
		z-index: var(--z-confirm-dialog, 300);
		max-width: min(480px, calc(100vw - 2rem));
		padding: 0;
		border: 0;
		background: transparent;
	}

	.confirm-card {
		margin: 0;
	}

	.confirm-detail {
		display: block;
		margin-top: 0.5rem;
		opacity: 0.7;
	}

	.confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin: 0;
	}
</style>
