import { browser } from '$app/environment';
import type { ConfirmIntent } from './types';

/**
 * Promise-based imperative confirmation state.
 *
 * @remarks
 * - Holds the active {@link ConfirmIntent} (read by `ConfirmDialog`) plus the
 *   pending Promise resolver. Callers `await confirmState.ask(intent)` and
 *   the dialog calls `confirmState.resolve(answer)` when the user clicks.
 * - SSR (`browser === false`): `ask()` resolves with `false` immediately so
 *   server-side code never hangs waiting for UI.
 * - Multiple `ask()` calls do not queue: the previous Promise is resolved
 *   with `false` before the new intent is installed. This keeps the API
 *   simple — at most one dialog is ever open.
 * - `resolve` is a public method but only `ConfirmDialog` should call it.
 */
export class ConfirmState {
	#intent: ConfirmIntent | null = $state(null);
	#pending: ((answer: boolean) => void) | null = null;

	get intent(): ConfirmIntent | null {
		return this.#intent;
	}

	async ask(intent: ConfirmIntent): Promise<boolean> {
		if (!browser) return false;

		const previous = this.#pending;
		this.#pending = null;
		if (previous !== null) previous(false);

		return new Promise<boolean>((resolve) => {
			this.#pending = resolve;
			this.#intent = intent;
		});
	}

	resolve(answer: boolean): void {
		const pending = this.#pending;
		this.#pending = null;
		this.#intent = null;
		if (pending !== null) pending(answer);
	}
}
