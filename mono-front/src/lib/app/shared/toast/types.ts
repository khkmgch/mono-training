/**
 * Type discriminator for toasts.
 *
 * Usage policy (per design 8.6):
 * - `'success'`: form-action success / `pending.run` success
 * - `'info'`: non-urgent informational notice (e.g. backend toggle confirmation)
 * - `'error'`: failures of NON-form async ops (downloads, exports, batch jobs).
 *   Form-action errors must go to `FormBanner` / `ConflictBanner` / `+error.svelte`
 *   via `dispatchActionError`, never to a toast.
 */
export type ToastType = 'success' | 'error' | 'info';

/** Caller-provided toast input. */
export type ToastInput = {
	type: ToastType;
	message: string;
	/** Dedup key. Same `key` collapses to the most recent toast. */
	key?: string;
	/**
	 * Auto-close delay in milliseconds. `0` / `undefined` keeps the toast
	 * visible until the user dismisses it.
	 *
	 * @remarks Set to `0` for `type: 'error'` to comply with WCAG 2.2.3.
	 *   The unit suffix is intentional — Readable Code-style explicit naming.
	 */
	autoCloseMs?: number;
	/** Optional supplementary detail (request id, link text, etc.). */
	detail?: string;
};

/** Stored toast with derived identity fields. */
export type Toast = ToastInput & {
	id: string;
	createdAt: number;
};
