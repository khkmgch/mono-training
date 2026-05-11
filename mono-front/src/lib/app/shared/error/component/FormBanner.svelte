<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { AppErrorCode } from '../types';

	type Props = {
		/** Form-level error received via `form?.error`. */
		error: App.Error | undefined;
	};

	let { error }: Props = $props();

	const TITLE_BY_CODE: Record<AppErrorCode, () => string> = {
		VALIDATION: m.shared_error_validation_title,
		CONFLICT_UNIQUE: m.shared_error_conflict_unique_title,
		CONFLICT_VERSION: m.shared_error_conflict_version_title,
		NOT_FOUND: m.shared_error_not_found_title,
		RATE_LIMIT: m.shared_error_rate_limit_title,
		NETWORK: m.shared_error_network_title,
		TIMEOUT: m.shared_error_timeout_title,
		PARSE: m.shared_error_parse_title,
		SYSTEM: m.shared_error_system_title
	};

	const title = $derived.by(() => {
		const code = error?.code;
		if (code !== undefined && code in TITLE_BY_CODE) return TITLE_BY_CODE[code]();
		return m.shared_error_system_title();
	});

	// CONFLICT_VERSION uses ConflictBanner instead.
	const visible = $derived(error !== undefined && error.code !== 'CONFLICT_VERSION');
</script>

{#if visible && error !== undefined}
	<article role="alert" tabindex="-1" class="form-banner">
		<strong>{title}</strong>
		<p>{error.message}</p>
		{#if error.fields !== undefined && error.fields.length > 0}
			<ul>
				{#each error.fields as field (field.name)}
					<li>{field.message}</li>
				{/each}
			</ul>
		{/if}
		{#if error.requestId !== undefined}
			<small>{m.shared_error_request_id_label({ requestId: error.requestId })}</small>
		{/if}
	</article>
{/if}

<style>
	.form-banner {
		border-left: 4px solid var(--pico-color-red-600, #dc2626);
	}

	.form-banner ul {
		margin: 0.5rem 0 0;
	}

	.form-banner small {
		display: block;
		margin-top: 0.5rem;
		opacity: 0.7;
	}
</style>
