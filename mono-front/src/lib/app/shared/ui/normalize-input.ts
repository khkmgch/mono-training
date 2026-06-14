import type { Action } from 'svelte/action';

type Normalizer = (raw: string) => string;

/**
 * Canonicalize an uncontrolled text input's value with `normalize` — on blur (so
 * the user sees the canonical form) and on the owning form's `formdata` event (so
 * a submit that skips blur still sends the canonical value). Used by the search
 * filters, whose values are URL-driven; Field does its own normalization via
 * `bind:value`. Passing `undefined` makes the action inert.
 *
 * `formdata` fires from `new FormData(form)`, which SearchForm runs at submit time.
 */
export const normalizeInput: Action<HTMLInputElement, Normalizer | undefined> = (
	node,
	normalize
) => {
	let normalizer = normalize;
	// Capture the form at mount so destroy() detaches from the same node.
	const form = node.form;

	function handleBlur(): void {
		if (normalizer === undefined) return;
		const next = normalizer(node.value);
		if (next !== node.value) node.value = next;
	}

	function handleFormData(event: FormDataEvent): void {
		if (normalizer === undefined || node.name === '') return;
		const raw = event.formData.get(node.name);
		if (typeof raw !== 'string') return;
		event.formData.set(node.name, normalizer(raw));
	}

	node.addEventListener('blur', handleBlur);
	form?.addEventListener('formdata', handleFormData);

	return {
		update(next: Normalizer | undefined): void {
			normalizer = next;
		},
		destroy(): void {
			node.removeEventListener('blur', handleBlur);
			form?.removeEventListener('formdata', handleFormData);
		}
	};
};
