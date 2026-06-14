<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { FormFieldError, hasFieldError, type FieldError } from '$lib/app/shared/error';

	type Props = {
		label: string;
		/** Field name — used for the input `name`, the generated id, and the
		 * `<FormFieldError>` binding. Must match the `name` the server reads
		 * from `formData` and the field name in `App.Error.fields[]`. */
		name: string;
		/** Restricted to text-family input types; non-text controls (checkbox,
		 * file, etc.) need their own dedicated wrapper rather than overloading
		 * this component. */
		type?: 'text' | 'email' | 'tel' | 'url' | 'search' | 'password' | 'number';
		value?: string | number;
		required?: boolean;
		maxlength?: number;
		minlength?: number;
		/** HTML5 `pattern` source (auto-anchored by the browser). Mirror the rule in `validate`. */
		pattern?: string;
		/** Typed via HTMLInputAttributes to enforce the autofill token union. */
		autocomplete?: HTMLInputAttributes['autocomplete'];
		hint?: string;
		error?: App.Error | null;
		/** Canonicalizer applied to the value on blur and on submit (via the
		 * form's `formdata` event). Omit to leave the value untouched; pass e.g.
		 * `collapseSpaces` / `stripSpaces` from `$lib/core/text`. */
		normalize?: (raw: string) => string;
		/** Client validator run on the value — on blur, on input after an error
		 * (reward early), and on submit via `validateNow()`. Returns a
		 * `FieldError` or `null`. */
		validate?: (value: string) => FieldError | null;
	};

	let {
		label,
		name,
		type = 'text',
		value = '',
		required = false,
		maxlength,
		minlength,
		pattern,
		autocomplete,
		hint,
		error,
		normalize,
		validate
	}: Props = $props();

	// Writable `$derived`: recomputes when `value` changes (initial load /
	// failed-submit re-render) yet accepts local edits via `bind:value`, so typed
	// text survives unrelated re-renders (e.g. when clientError updates).
	let currentValue = $derived(String(value));
	let touched = $state(false);
	let clientError = $state<FieldError | null>(null);
	let inputEl: HTMLInputElement | undefined = $state();

	// `$derived` so the ids track a hypothetical `name` prop change instead
	// of freezing at component-init (Svelte 5 state_referenced_locally guard).
	const inputId = $derived(`field-${name}`);
	const hintId = $derived(`${inputId}-hint`);

	// Client validation takes precedence; otherwise fall back to the server error.
	const effectiveError = $derived<App.Error | undefined>(
		clientError !== null
			? { message: '', code: 'VALIDATION', fields: [clientError] }
			: (error ?? undefined)
	);
	const invalid = $derived(hasFieldError(effectiveError, name));

	function check(candidate: string): void {
		clientError = validate?.(candidate) ?? null;
	}

	function handleBlur(): void {
		if (normalize !== undefined) currentValue = normalize(currentValue);
		touched = true;
		check(currentValue);
	}

	// Reward early: once a field has shown an error, re-validate as the user types.
	function handleInput(): void {
		if (touched) check(currentValue);
	}

	/** Validate immediately — used by the parent form on submit, including
	 * fields the user never blurred. Returns `true` when valid. */
	export function validateNow(): boolean {
		touched = true;
		check(currentValue);
		return clientError === null;
	}

	// Submit-time normalization for fields that skipped blur (Enter / button click).
	// `new FormData(form)` — run by enhance / SearchForm at submit — fires `formdata`.
	$effect(() => {
		const form = inputEl?.form ?? null;
		if (form === null) return;
		function handleFormData(event: FormDataEvent): void {
			if (normalize !== undefined && name !== '') {
				event.formData.set(name, normalize(currentValue));
			}
		}
		form.addEventListener('formdata', handleFormData);
		return () => form.removeEventListener('formdata', handleFormData);
	});
</script>

<div class="field">
	<label for={inputId}>
		{label}
		{#if required}<span class="required" aria-hidden="true">*</span>{/if}
	</label>
	<input
		bind:this={inputEl}
		bind:value={currentValue}
		id={inputId}
		{name}
		{type}
		{required}
		{maxlength}
		{minlength}
		{pattern}
		{autocomplete}
		aria-describedby={hint !== undefined ? hintId : undefined}
		aria-invalid={invalid || undefined}
		oninput={handleInput}
		onblur={handleBlur}
	/>
	{#if hint !== undefined}
		<small id={hintId} class="hint">{hint}</small>
	{/if}
	<FormFieldError {name} {label} max={maxlength} min={minlength} error={effectiveError} />
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--ds-space-1);
	}

	.field label {
		margin: 0;
		font-weight: 500;
	}

	.field input {
		margin: 0;
	}

	.required {
		margin-left: var(--ds-space-1);
		color: var(--ds-color-error);
	}

	.hint {
		/* Cancel pico's `:where(input, ...) + small` helper-text margins
		 * (negative margin-top would overlap the input); `.field` gap handles spacing. */
		margin: 0;
		color: var(--ds-text-muted);
		font-size: var(--ds-fs-small);
	}
</style>
