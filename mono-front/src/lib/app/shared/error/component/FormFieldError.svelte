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
		<span class="visually-hidden">{m.common_a11y_error_prefix()}</span>
		{fieldError.message}
	</small>
{/if}

<style>
	.form-field-error {
		display: block;
		color: var(--pico-color-red-600, #dc2626);
		margin-top: 0.25rem;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
