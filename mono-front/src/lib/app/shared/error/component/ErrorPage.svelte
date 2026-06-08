<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import type { AppErrorCode } from '../types';

	type Props = {
		/** Custom body. Falls back to a localized, code-driven message + request id when absent. */
		children?: Snippet<[error: App.Error, status: number]>;
		/** Custom action buttons. Falls back to code-driven defaults when absent. */
		actions?: Snippet<[error: App.Error, status: number]>;
	};

	let { children, actions }: Props = $props();

	const FALLBACK_ERROR: App.Error = { message: '' };
	const error = $derived<App.Error>(page.error ?? FALLBACK_ERROR);
	const status = $derived(page.status);

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
		const code = error.code;
		if (code !== undefined && code in TITLE_BY_CODE) return TITLE_BY_CODE[code]();
		return m.shared_error_system_title();
	});

	// Localized body by code — never the backend's English detail.
	const body = $derived.by(() => {
		switch (error.code) {
			case 'NOT_FOUND':
				return m.shared_error_not_found_body();
			case 'SYSTEM':
			case 'PARSE':
				return m.shared_error_system_body();
			case 'RATE_LIMIT':
				return error.retryAfterSec !== undefined
					? m.shared_error_rate_limit_body_with_seconds({ seconds: error.retryAfterSec })
					: m.shared_error_rate_limit_body();
			default:
				return undefined;
		}
	});

	function reload(): void {
		if (typeof location !== 'undefined') location.reload();
	}
</script>

<article role="alert" class="error-page">
	<header>
		<h1>{title}</h1>
		<small class="status">HTTP {status}</small>
	</header>

	{#if children}
		{@render children(error, status)}
	{:else if body !== undefined}<p>{body}</p>{/if}

	<footer class="actions">
		{#if actions}
			{@render actions(error, status)}
		{:else}
			{#if error.code === 'NETWORK' || error.code === 'TIMEOUT'}
				<button type="button" onclick={reload}>{m.app_action_retry()}</button>
			{/if}
			<a href={resolve('/')} role="button" class="secondary">{m.app_action_back_to_top()}</a>
		{/if}
	</footer>
</article>

<style>
	.error-page {
		max-width: 640px;
		margin: 2rem auto;
	}

	.status {
		opacity: 0.6;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
