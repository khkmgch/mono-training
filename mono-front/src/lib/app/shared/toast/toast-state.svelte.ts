import { browser } from '$app/environment';
import type { Toast, ToastInput } from './types';

/**
 * Reactive toast collection plus auto-close scheduling.
 *
 * @remarks
 * - State lives in the root layout's component context (in-memory, single
 *   window). It survives SvelteKit client-side navigation but is dropped on
 *   `browser full reload` (F5 / direct URL / `data-sveltekit-reload`).
 * - `push` is safe to call during SSR (state mutation only). Auto-close
 *   timers are guarded by `browser` so the server never schedules timers.
 * - Dedup by `key`: pushing with an existing key replaces the entry in place
 *   and resets its auto-close timer.
 */
export class ToastState {
	#items: Toast[] = $state([]);
	// Plain Map: timers are not reactive UI state, only book-keeping for setTimeout cleanup.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	readonly #timers = new Map<string, ReturnType<typeof setTimeout>>();

	get items(): ReadonlyArray<Toast> {
		return this.#items;
	}

	push(input: ToastInput): string {
		if (input.key !== undefined) {
			const existingIndex = this.#items.findIndex((item) => item.key === input.key);
			if (existingIndex !== -1) {
				const existing = this.#items[existingIndex];
				this.#clearTimer(existing.id);
				const replacement: Toast = { ...input, id: existing.id, createdAt: Date.now() };
				this.#items[existingIndex] = replacement;
				this.#scheduleAutoClose(replacement);
				return existing.id;
			}
		}

		const toast: Toast = { ...input, id: generateToastId(), createdAt: Date.now() };
		this.#items.push(toast);
		this.#scheduleAutoClose(toast);
		return toast.id;
	}

	dismiss(id: string): void {
		this.#clearTimer(id);
		const index = this.#items.findIndex((item) => item.id === id);
		if (index !== -1) this.#items.splice(index, 1);
	}

	clear(): void {
		for (const timer of this.#timers.values()) clearTimeout(timer);
		this.#timers.clear();
		this.#items = [];
	}

	#scheduleAutoClose(toast: Toast): void {
		if (!browser) return;
		if (toast.autoCloseMs === undefined || toast.autoCloseMs <= 0) return;
		const timer = setTimeout(() => this.dismiss(toast.id), toast.autoCloseMs);
		this.#timers.set(toast.id, timer);
	}

	#clearTimer(id: string): void {
		const timer = this.#timers.get(id);
		if (timer !== undefined) {
			clearTimeout(timer);
			this.#timers.delete(id);
		}
	}
}

function generateToastId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
