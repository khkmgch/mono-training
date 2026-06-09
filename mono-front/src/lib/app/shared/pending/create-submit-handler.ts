import type { ActionResult } from '@sveltejs/kit';
import { applyAction } from '$app/forms';
import { getConfirmContext, type ConfirmIntent, type ConfirmState } from '../confirmation';
import { focusFirstFieldError } from '../error';
import { dispatchActionSuccess, type SuccessIntent } from '../success';
import { getToastContext, type ToastState } from '../toast';
import type { PendingSubmitFunction } from './enhance-with-pending';

export type SubmitInput = {
	formData: FormData;
	formElement: HTMLFormElement;
	action: URL;
	controller: AbortController;
	submitter: HTMLElement | null;
	cancel: () => void;
};

export type SubmitOpts<TSuccess extends Record<string, unknown> = Record<string, unknown>> = {
	formData: FormData;
	formElement: HTMLFormElement;
	action: URL;
	result: ActionResult<TSuccess>;
	update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>;
};

export type SubmitHandlerOptions<
	TSuccess extends Record<string, unknown> = Record<string, unknown>
> = {
	/**
	 * Confirmation dialog. Either a static {@link ConfirmIntent} (always asked)
	 * or a function deriving the intent from the submit input. Returning
	 * `null` from the function skips confirmation for that submission.
	 */
	confirm?:
		| ConfirmIntent
		| ((input: SubmitInput) => ConfirmIntent | null | Promise<ConfirmIntent | null>);

	/**
	 * Success behavior. Either a static {@link SuccessIntent} or a function
	 * that derives one from the result. Returning `null` (or omitting `success`)
	 * falls back to `update()` with default options (no toast, no navigation).
	 */
	success?:
		| SuccessIntent
		| ((
				opts: SubmitOpts<TSuccess> & { result: ActionResult<TSuccess> & { type: 'success' } }
		  ) => SuccessIntent | null);

	/**
	 * Failure behavior. `'auto'` calls `update()` and, when the surfaced
	 * `App.Error.code` is `'VALIDATION'` or `'CONFLICT_UNIQUE'`, focuses the
	 * first invalid field. Other codes rely on the server-provided UI
	 * (`FormBanner` / `ConflictBanner` / `+error.svelte`).
	 *
	 * Pass a function for custom handling — it must call `update()` itself
	 * if a re-render is desired.
	 */
	failure?:
		| 'auto'
		| ((
				opts: SubmitOpts<TSuccess> & { result: ActionResult<TSuccess> & { type: 'failure' } }
		  ) => void | Promise<void>);

	/**
	 * Optional pre-flight hook. Runs before {@link confirm}. Returning `false`
	 * or calling `cancel()` aborts the submission.
	 */
	onSubmit?: (input: SubmitInput) => boolean | void | Promise<boolean | void>;

	/**
	 * Optional post-result hook. Runs for every result type (`success` /
	 * `failure` / `redirect` / `error`) after the type-specific handling.
	 * Not called when the submission was cancelled (e.g. confirm dismissed).
	 */
	onResult?: (opts: SubmitOpts<TSuccess>) => void | Promise<void>;
};

/**
 * Build a {@link PendingSubmitFunction} that orchestrates confirmation,
 * success handling, failure handling, and the bookkeeping callbacks declared
 * in {@link SubmitHandlerOptions}.
 *
 * @remarks
 * Confirmation flow uses a two-pass `requestSubmit` pattern (shadcn-svelte
 * lineage):
 *   1. First submit → `cancel()` + open dialog.
 *   2. User confirms → set internal `confirmed` flag → call
 *      `formElement.requestSubmit(submitter)`.
 *   3. Second submit observes `confirmed === true`, skips the dialog, clears
 *      the flag, and proceeds.
 * The flag is closure-local, so re-mounting the form (and creating a new
 * handler) resets it automatically.
 */
export function createSubmitHandler<
	TSuccess extends Record<string, unknown> = Record<string, unknown>
>(options: SubmitHandlerOptions<TSuccess>): PendingSubmitFunction {
	const confirmedState = { confirmed: false };

	/* Capture context references synchronously at handler creation, while we
	 * are still inside the component initialisation phase. The async callbacks
	 * below (runConfirmDialog / runSuccess) run AFTER the submit lifecycle
	 * starts, by which time Svelte has torn down the init phase and a call to
	 * `getContext()` would throw `lifecycle_outside_component`. */
	const toasts = getToastContext();
	const confirmCtx = getConfirmContext();

	return async (input) => {
		const cancelState = { cancelled: false };
		const wrappedInput = wrapWithSharedCancel(input, cancelState);

		const proceed = await runPreSubmitGuards(
			options,
			wrappedInput,
			cancelState,
			confirmedState,
			confirmCtx
		);
		if (!proceed) return;

		return async (callback) => {
			const opts: SubmitOpts<TSuccess> = {
				formData: input.formData,
				formElement: input.formElement,
				action: input.action,
				// result.data is Record<string, any> from enhance; TSuccess is the action's declared payload.
				result: callback.result as ActionResult<TSuccess>,
				update: callback.update
			};

			await runResultHandler(options, opts, toasts);

			if (options.onResult !== undefined) {
				await options.onResult(opts);
			}
		};
	};
}

function wrapWithSharedCancel(input: SubmitInput, state: { cancelled: boolean }): SubmitInput {
	const originalCancel = input.cancel;
	return {
		...input,
		cancel: (): void => {
			if (state.cancelled) return;
			state.cancelled = true;
			originalCancel();
		}
	};
}

async function runPreSubmitGuards(
	options: Pick<SubmitHandlerOptions, 'confirm' | 'onSubmit'>,
	wrappedInput: SubmitInput,
	cancelState: { cancelled: boolean },
	confirmedState: { confirmed: boolean },
	confirmCtx: ConfirmState
): Promise<boolean> {
	if (options.onSubmit !== undefined) {
		const result = await options.onSubmit(wrappedInput);
		if (result === false) wrappedInput.cancel();
		if (cancelState.cancelled) return false;
	}
	if (confirmedState.confirmed) {
		confirmedState.confirmed = false;
		return true;
	}
	return await runConfirmDialog(options, wrappedInput, confirmedState, confirmCtx);
}

async function runConfirmDialog(
	options: Pick<SubmitHandlerOptions, 'confirm'>,
	wrappedInput: SubmitInput,
	confirmedState: { confirmed: boolean },
	confirmCtx: ConfirmState
): Promise<boolean> {
	const intent = await resolveConfirmIntent(options.confirm, wrappedInput);
	if (intent === null) return true;
	wrappedInput.cancel();
	const answer = await confirmCtx.ask(intent);
	if (answer) {
		confirmedState.confirmed = true;
		wrappedInput.formElement.requestSubmit(
			wrappedInput.submitter instanceof HTMLElement ? wrappedInput.submitter : undefined
		);
	}
	return false;
}

async function resolveConfirmIntent(
	option: SubmitHandlerOptions['confirm'],
	input: SubmitInput
): Promise<ConfirmIntent | null> {
	if (option === undefined) return null;
	if (typeof option === 'function') return (await option(input)) ?? null;
	return option;
}

async function runResultHandler<TSuccess extends Record<string, unknown>>(
	options: SubmitHandlerOptions<TSuccess>,
	opts: SubmitOpts<TSuccess>,
	toasts: ToastState
): Promise<void> {
	const { result } = opts;
	switch (result.type) {
		case 'success':
			await runSuccess(options, result, opts, toasts);
			return;
		case 'failure':
			await runFailure(options, result, opts);
			return;
		case 'redirect':
		case 'error':
			// A custom enhance callback replaces SvelteKit's default, so applyAction must be invoked
			// explicitly: it follows redirects and renders the nearest +error boundary. Without this
			// a thrown error() from the action (e.g. 404 on a concurrently-deleted row) shows nothing.
			await applyAction(result);
			return;
	}
}

async function runSuccess<TSuccess extends Record<string, unknown>>(
	options: SubmitHandlerOptions<TSuccess>,
	result: ActionResult<TSuccess> & { type: 'success' },
	opts: SubmitOpts<TSuccess>,
	toasts: ToastState
): Promise<void> {
	const intent =
		typeof options.success === 'function' ? options.success({ ...opts, result }) : options.success;
	if (intent !== null && intent !== undefined) {
		await dispatchActionSuccess(intent, { toasts, update: opts.update });
	} else {
		await opts.update();
	}
}

async function runFailure<TSuccess extends Record<string, unknown>>(
	options: SubmitHandlerOptions<TSuccess>,
	result: ActionResult<TSuccess> & { type: 'failure' },
	opts: SubmitOpts<TSuccess>
): Promise<void> {
	if (options.failure === 'auto') {
		await opts.update();
		const data = result.data as { error?: App.Error } | undefined;
		const error = data?.error;
		if (error?.code === 'VALIDATION' || error?.code === 'CONFLICT_UNIQUE') {
			focusFirstFieldError(opts.formElement, error);
		}
		return;
	}
	if (typeof options.failure === 'function') {
		await options.failure({ ...opts, result });
		return;
	}
	await opts.update();
}
