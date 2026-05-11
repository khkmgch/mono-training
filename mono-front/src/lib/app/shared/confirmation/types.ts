/**
 * Confirmation dialog input contract.
 *
 * `ConfirmState.ask(intent)` displays the dialog and resolves with the
 * user's answer (`true` for confirm, `false` for cancel / Escape / SSR).
 */
export type ConfirmIntent = {
	/** Dialog title (e.g. `"ユーザーの削除"`). */
	title: string;
	/** Body message. */
	message: string;
	/** Optional supplementary detail rendered in `<small>` below the message. */
	detail?: string;
	/** Confirm button label. Defaults to `m.term_action_confirm()`. */
	confirmLabel?: string;
	/** Cancel button label. Defaults to `m.term_action_cancel()`. */
	cancelLabel?: string;
	/**
	 * Mark the operation as destructive (delete, overwrite, etc.).
	 *
	 * - `true`: confirm button gets pico `class="contrast"`, initial focus moves
	 *   to cancel, and the dialog is rendered with `role="alertdialog"`.
	 * - `false` / `undefined` (default): confirm button is primary and gets
	 *   initial focus; the dialog is rendered with `role="dialog"`.
	 */
	destructive?: boolean;
};
