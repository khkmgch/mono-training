import { goto, invalidate } from '$app/navigation';
import type { ToastState } from '../toast';
import type { SuccessIntent } from './types';

type InvalidateTarget = string | URL | ((url: URL) => boolean);

/** Default auto-close for success/info toasts when the caller omits `autoCloseMs`. */
const DEFAULT_SUCCESS_TOAST_AUTO_CLOSE_MS = 3000;

/**
 * Order is contractual: the toast is pushed before `update()` so it survives the
 * subsequent reload/navigation.
 */
export async function dispatchActionSuccess(
	intent: SuccessIntent,
	ctx: {
		toasts: ToastState;
		update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>;
	}
): Promise<void> {
	if (intent.toast !== undefined) {
		const { type = 'success', autoCloseMs, ...rest } = intent.toast;
		ctx.toasts.push({
			type,
			autoCloseMs: autoCloseMs ?? DEFAULT_SUCCESS_TOAST_AUTO_CLOSE_MS,
			...rest
		});
	}

	const target = intent.invalidate ?? 'all';
	const reset = intent.resetForm ?? false;
	await ctx.update({ reset, invalidateAll: target === 'all' });

	if (target !== 'all' && target !== 'none') {
		await invalidate(target as InvalidateTarget);
	}

	if (intent.navigateTo !== undefined) {
		// `resolve()` requires statically-typed routes; we accept any runtime string here so
		// callers can navigate to dynamic targets (e.g. `/users/${id}` constructed at submit time).
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(intent.navigateTo);
	}
}
