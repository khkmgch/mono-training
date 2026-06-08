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

	// Body is localized per code — never the backend's English detail. Field-level codes
	// (VALIDATION / CONFLICT_UNIQUE) rely on the inline FormFieldError, so they show no body.
	const body = $derived.by(() => {
		if (error?.code !== 'RATE_LIMIT') return undefined;
		return error.retryAfterSec !== undefined
			? m.shared_error_rate_limit_body_with_seconds({ seconds: error.retryAfterSec })
			: m.shared_error_rate_limit_body();
	});

	// CONFLICT_VERSION uses ConflictBanner instead.
	const visible = $derived(error !== undefined && error.code !== 'CONFLICT_VERSION');
</script>

{#if visible && error !== undefined}
	<article role="alert" tabindex="-1" class="form-banner">
		<strong>{title}</strong>
		{#if body !== undefined}<p>{body}</p>{/if}
	</article>
{/if}

<style>
	.form-banner {
		border-left: 4px solid var(--ds-color-error);
	}
</style>
