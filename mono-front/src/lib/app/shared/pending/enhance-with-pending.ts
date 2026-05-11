import { enhance } from '$app/forms';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
import { getPendingContext } from './context.svelte';

/**
 * SubmitFunction shape consumed by {@link enhanceWithPending}. Identical to
 * Kit's `SubmitFunction` (input includes `controller`, `submitter`, `cancel`;
 * the optional callback receives `result` / `formData` / `formElement` /
 * `action` / `update`).
 */
export type PendingSubmitFunction = SubmitFunction;

/**
 * Options passed to the optional post-submit callback returned from
 * {@link PendingSubmitFunction}. Mirrors Kit's callback shape.
 */
export type SubmitCallbackOpts = {
	formData: FormData;
	formElement: HTMLFormElement;
	action: URL;
	result: ActionResult;
	update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>;
};

/**
 * Wrap a form with `use:enhanceWithPending={submit}`.
 *
 * Calls SvelteKit `enhance` internally so all standard form-action behavior
 * is preserved (default `applyAction`, `update`, `controller.signal` for
 * back-pressure on rapid resubmits, etc.). On every submit lifecycle:
 *
 * 1. `pending.start()` is invoked at the beginning.
 * 2. The user's `submit` (if any) runs. If it calls `cancel()` or throws,
 *    `pending.end()` runs immediately.
 * 3. If `submit` returned a callback, it runs after the response with
 *    `pending.end()` guaranteed in the callback's `finally` block.
 */
export function enhanceWithPending(
	node: HTMLFormElement,
	submit?: PendingSubmitFunction
): { destroy: () => void } {
	const pending = getPendingContext();

	const wrapped: SubmitFunction = async (input) => {
		pending.start();
		let endCalled = false;
		const endOnce = (): void => {
			if (endCalled) return;
			endCalled = true;
			pending.end();
		};

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
