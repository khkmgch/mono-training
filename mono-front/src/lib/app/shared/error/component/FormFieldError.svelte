<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	type Props = {
		/** Target input's `name` attribute. */
		name: string;
		/** Field label, woven into the localized message. */
		label: string;
		/** Max length, used by the `size` rule's message. */
		max?: number;
		/** The form-level error received via `form?.error`. */
		error: App.Error | undefined;
	};

	let { name, label, max, error }: Props = $props();

	// Localize by the backend rule code; the raw backend message (English) is never shown.
	const message = $derived.by(() => {
		const field = error?.fields?.find((f) => f.name === name);
		if (field === undefined) return undefined;
		switch (field.code) {
			case 'required':
				return m.common_validation_required({ field: label });
			case 'unique':
				return m.common_validation_unique({ field: label });
			case 'size':
				return max !== undefined
					? m.common_validation_max_chars({ field: label, max })
					: m.common_validation_invalid({ field: label });
			default:
				return m.common_validation_invalid({ field: label });
		}
	});
</script>

{#if message !== undefined}
	<small role="alert" id="{name}-error" class="form-field-error">
		<span class="sr-only">{m.common_a11y_error_prefix()}</span>
		{message}
	</small>
{/if}

<style>
	.form-field-error {
		display: block;
		color: var(--ds-color-error);
		margin-top: 0.25rem;
	}
</style>
