import { enhance } from '$app/forms';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
import { getPendingContext } from './context.svelte';
import type { PendingState } from './pending-state.svelte';

export type PendingSubmitFunction = SubmitFunction;

/** Kit's post-submit callback parameter, which Kit does not export as a named type. */
export type SubmitCallbackOpts = {
	formData: FormData;
	formElement: HTMLFormElement;
	action: URL;
	result: ActionResult;
	update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>;
};

export type EnhanceWithPendingOptions = {
	/** Same contract as passing the function directly. */
	submit?: PendingSubmitFunction;
	/** Per-form pending state, started and ended in lockstep with the global counter. */
	formPending?: PendingState;
};

/**
 * `enhance` with a pending-state lifecycle and a first-wins re-entry guard.
 *
 * Kit does not serialize concurrent submissions of the same form — each
 * submit starts an independent fetch that Kit itself never aborts (kit 2.55)
 * — and form actions are not idempotent, so a submit arriving while one is
 * in flight is cancelled before any user code runs.
 *
 * The global pending counter and `formPending` start and end with the
 * submission. `cancel()` or a throw ends the lifecycle immediately, so a
 * confirm-dialog first pass releases the guard while the dialog is open.
 */
export function enhanceWithPending(
	node: HTMLFormElement,
	param?: PendingSubmitFunction | EnhanceWithPendingOptions
): { destroy: () => void } {
	const { submit, formPending }: EnhanceWithPendingOptions =
		typeof param === 'function' ? { submit: param } : (param ?? {});
	const pending = getPendingContext();

	// JS is on (this ran): suppress native constraint bubbles so FormFieldError
	// owns the validation UX. Progressive enhancement — JS-off keeps native validation.
	node.noValidate = true;

	let inFlight = false;

	const wrapped: SubmitFunction = async (input) => {
		if (inFlight) {
			input.cancel();
			return;
		}
		inFlight = true;
		pending.start();
		formPending?.start();

		let endCalled = false;
		const endOnce = (): void => {
			if (endCalled) return;
			endCalled = true;
			inFlight = false;
			pending.end();
			formPending?.end();
		};

		// Kit invokes no callbacks after an abort; this is the only hook that closes the lifecycle.
		input.controller.signal.addEventListener('abort', endOnce, { once: true });

		const userCancel = input.cancel;
		const wrappedCancel = (): void => {
			userCancel();
			endOnce();
		};

		let userResult: Awaited<ReturnType<SubmitFunction>>;
		try {
			userResult = submit ? await submit({ ...input, cancel: wrappedCancel }) : undefined;
		} catch (err) {
			endOnce();
			throw err;
		}

		if (endCalled) return;

		return async (callback) => {
			try {
				if (typeof userResult === 'function') {
					await userResult(callback);
				} else {
					await callback.update();
				}
			} finally {
				endOnce();
			}
		};
	};

	return enhance(node, wrapped);
}
