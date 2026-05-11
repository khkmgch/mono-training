import type { ToastInput } from '../toast';

/**
 * Declarative success outcome consumed by `dispatchActionSuccess` and
 * `createSubmitHandler`'s `success` option.
 *
 * @remarks Default values are applied at runtime (per design 8.5.2):
 * - `invalidate`: `'all'` when omitted
 * - `resetForm`: `true` when omitted
 *
 * The optional shape on `SuccessIntent` is intentionally preserved so callers
 * can build intents incrementally without explicit defaults.
 */
export type SuccessIntent = {
	/**
	 * Success notification. When omitted no toast is shown.
	 * `type` defaults to `'success'`; only `'success'` and `'info'` are allowed
	 * (errors must not be routed through success flows — see 9.1.2).
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

	/** Reset form fields after success. Defaults to `true`. */
	resetForm?: boolean;
};
