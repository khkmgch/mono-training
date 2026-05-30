import type { ToastInput } from '../toast';

/**
 * Declarative success outcome consumed by `dispatchActionSuccess` and
 * `createSubmitHandler`'s `success` option. Every field is optional; the
 * runtime default for each is documented on the field below.
 */
export type SuccessIntent = {
	/**
	 * Success notification. When omitted no toast is shown. `type` defaults to
	 * `'success'`. `autoCloseMs` defaults to 3000; pass `0` to keep the toast
	 * visible until the user dismisses it.
	 */
	toast?: Omit<ToastInput, 'type'> & { type?: 'success' | 'info' };

	/**
	 * Navigation target. Pass a path string to `goto` after the post-action
	 * update. Omit to stay on the current page (or rely on the action's
	 * `throw redirect(303, ...)`).
	 */
	navigateTo?: string;

	/**
	 * Re-fetch strategy. Defaults to `'all'`.
	 *
	 * - `'all'`: `update({ invalidateAll: true })` (Kit's `enhance` default)
	 * - `'none'`: `update({ invalidateAll: false })` (no refetch)
	 * - `string` / `URL`: `update({ invalidateAll: false })` then `invalidate(target)`
	 * - `(url: URL) => boolean`: `update({ invalidateAll: false })` then
	 *   `invalidate(predicate)`
	 */
	invalidate?: 'all' | 'none' | string | URL | ((url: URL) => boolean);

	/**
	 * Reset form fields after success. Defaults to `false` so user input is
	 * never silently dropped — opt in to `true` for "create-and-stay" forms
	 * that should clear after each submission (e.g. bulk-entry workflows).
	 */
	resetForm?: boolean;
};
