import { goto, invalidate } from '$app/navigation';
import type { ToastState } from '../toast';
import type { SuccessIntent } from './types';

type InvalidateTarget = string | URL | ((url: URL) => boolean);

/**
 * Funnel a `result.type === 'success'` ActionResult through toast +
 * invalidate + navigate, in this exact order:
 *
 *   1. push toast (so it is visible during the subsequent reload)
 *   2. `update({ reset, invalidateAll })`
 *   3. additional `invalidate(target)` for string / URL / predicate targets
 *      (skipped when `target` is `'all'` or `'none'`)
 *   4. `goto(navigateTo)` if specified
 *
 * @remarks Defaults are applied at runtime: `invalidate` defaults to `'all'`,
 *   `resetForm` defaults to `true`. Both can be overridden per call.
 *   SSR-safe: form-action callbacks are client-only by SvelteKit contract.
 */
export async function dispatchActionSuccess(
	intent: SuccessIntent,
	ctx: {
		toasts: ToastState;
		update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>;
	}
): Promise<void> {
	if (intent.toast !== undefined) {
		const { type = 'success', ...rest } = intent.toast;
		ctx.toasts.push({ type, ...rest });
	}

	const target = intent.invalidate ?? 'all';
	const reset = intent.resetForm ?? true;
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
