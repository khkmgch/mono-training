<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { FormFieldError, hasFieldError } from '$lib/app/shared/error';

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
		/** Typed via HTMLInputAttributes to enforce the autofill token union. */
		autocomplete?: HTMLInputAttributes['autocomplete'];
		hint?: string;
		error?: App.Error | null;
	};

	let {
		label,
		name,
		type = 'text',
		value = '',
		required = false,
		maxlength,
		autocomplete,
		hint,
		error
	}: Props = $props();

	// `$derived` so the ids track a hypothetical `name` prop change instead
	// of freezing at component-init (Svelte 5 state_referenced_locally guard).
	const inputId = $derived(`field-${name}`);
	const hintId = $derived(`${inputId}-hint`);
	const invalid = $derived(hasFieldError(error ?? undefined, name));
</script>

<div class="field">
	<label for={inputId}>
		{label}
		{#if required}<span class="required" aria-hidden="true">*</span>{/if}
	</label>
	<input
		id={inputId}
		{name}
		{type}
		{value}
		{required}
		{maxlength}
		{autocomplete}
		aria-describedby={hint !== undefined ? hintId : undefined}
		aria-invalid={invalid || undefined}
	/>
	{#if hint !== undefined}
		<small id={hintId} class="hint">{hint}</small>
	{/if}
	<FormFieldError {name} {label} max={maxlength} error={error ?? undefined} />
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
