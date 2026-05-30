<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	type Props = {
		/** Target input's `name` attribute. */
		name: string;
		/** The form-level error received via `form?.error`. */
		error: App.Error | undefined;
	};

	let { name, error }: Props = $props();

	const fieldError = $derived.by(() => {
		const fields = error?.fields;
		if (fields === undefined || fields.length === 0) return undefined;
		return fields.find((f) => f.name === name);
	});
</script>

{#if fieldError !== undefined}
	<small role="alert" id="{name}-error" class="form-field-error">
		<span class="sr-only">{m.common_a11y_error_prefix()}</span>
		{fieldError.message}
	</small>
{/if}

<style>
	.form-field-error {
		display: block;
		color: var(--ds-color-error);
		margin-top: 0.25rem;
	}
</style>
