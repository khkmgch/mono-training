import { getContext, setContext } from 'svelte';
import { ToastState } from './toast-state.svelte';

const TOAST_CONTEXT_KEY = Symbol('app/shared/toast');

/** Install a fresh {@link ToastState} on the current component tree. Call once in root layout. */
export function setToastContext(): ToastState {
	const state = new ToastState();
	setContext(TOAST_CONTEXT_KEY, state);
	return state;
}

/** Retrieve the {@link ToastState} installed by {@link setToastContext}. */
export function getToastContext(): ToastState {
	const state = getContext<ToastState | undefined>(TOAST_CONTEXT_KEY);
	if (state === undefined) {
		throw new Error(
			'ToastState context is not set. Call setToastContext() in the root +layout.svelte.'
		);
	}
	return state;
}
