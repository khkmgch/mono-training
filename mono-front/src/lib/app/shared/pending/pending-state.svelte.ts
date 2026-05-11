import { browser } from '$app/environment';

const PENDING_DELAY_MS = 100;

/**
 * Reactive pending state shared across navigation, form-submit, and ad-hoc paths.
 *
 * @remarks
 * - **runes-based**. Instantiate inside a `.svelte.ts` file (or via
 *   `setPendingContext`) so the rune machinery is wired up.
 * - SSR (`browser === false`): `visible` is always `false`. No timers are
 *   scheduled.
 * - 100ms flash-prevention delay: a freshly started operation does not show
 *   the indicator until the delay has elapsed and the operation is still
 *   active. Operations that complete inside the window stay invisible.
 * - Counter is balanced: `start, start, end` keeps `visible: true`;
 *   `start, end, end` resets. The second `end()` while count is already
 *   zero is a safe no-op.
 * - Multiple paths (navigation / form / ad-hoc) share the same counter, so
 *   any combination of overlapping operations keeps the indicator visible.
 */
export class PendingState {
	#count = $state(0);
	#visible = $state(false);
	#timer: ReturnType<typeof setTimeout> | null = null;

	get visible(): boolean {
		if (!browser) return false;
		return this.#visible;
	}

	start(): void {
		if (!browser) return;
		this.#count += 1;
		if (this.#count === 1 && this.#timer === null && !this.#visible) {
			this.#timer = setTimeout(() => {
				this.#timer = null;
				if (this.#count > 0) this.#visible = true;
			}, PENDING_DELAY_MS);
		}
	}

	end(): void {
		if (!browser) return;
		if (this.#count === 0) return;
		this.#count -= 1;
		if (this.#count === 0) {
			if (this.#timer !== null) {
				clearTimeout(this.#timer);
				this.#timer = null;
			}
			this.#visible = false;
		}
	}

	async run<T>(fn: () => Promise<T>): Promise<T> {
		this.start();
		try {
			return await fn();
		} finally {
			this.end();
		}
	}
}
