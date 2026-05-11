import { getContext, setContext } from 'svelte';
import { ConfirmState } from './confirm-state.svelte';

const CONFIRM_CONTEXT_KEY = Symbol('app/shared/confirmation');

/** Install a fresh {@link ConfirmState} on the current component tree. Call once in root layout. */
export function setConfirmContext(): ConfirmState {
	const state = new ConfirmState();
	setContext(CONFIRM_CONTEXT_KEY, state);
	return state;
}

/** Retrieve the {@link ConfirmState} installed by {@link setConfirmContext}. */
export function getConfirmContext(): ConfirmState {
	const state = getContext<ConfirmState | undefined>(CONFIRM_CONTEXT_KEY);
	if (state === undefined) {
		throw new Error(
			'ConfirmState context is not set. Call setConfirmContext() in the root +layout.svelte.'
		);
	}
	return state;
}
