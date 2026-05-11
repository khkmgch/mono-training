import { getContext, setContext } from 'svelte';
import { browser } from '$app/environment';
import { navigating } from '$app/state';
import { PendingState } from './pending-state.svelte';

const PENDING_CONTEXT_KEY = Symbol('app/shared/pending');

/**
 * Install a fresh {@link PendingState} on the current component tree and
 * subscribe it to SvelteKit navigation so navigations participate in the
 * shared counter. Call exactly once in the root layout.
 *
 * @remarks Must be called from a component `<script>` (e.g. the root
 *   `+layout.svelte`) — the navigation-syncing `$effect` is bound to that
 *   component's lifecycle and is cleaned up automatically when it unmounts.
 */
export function setPendingContext(): PendingState {
	const state = new PendingState();
	setContext(PENDING_CONTEXT_KEY, state);

	if (browser) {
		let navigationActive = false;
		$effect(() => {
			const isNavigating = navigating.to !== null;
			if (isNavigating && !navigationActive) {
				navigationActive = true;
				state.start();
			} else if (!isNavigating && navigationActive) {
				navigationActive = false;
				state.end();
			}
		});
	}

	return state;
}

export function getPendingContext(): PendingState {
	const state = getContext<PendingState | undefined>(PENDING_CONTEXT_KEY);
	if (state === undefined) {
		throw new Error(
			'PendingState context is not set. Call setPendingContext() in the root +layout.svelte.'
		);
	}
	return state;
}
