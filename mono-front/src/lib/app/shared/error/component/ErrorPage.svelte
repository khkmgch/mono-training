<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import type { AppErrorCode } from '../types';

	type Props = {
		/** Custom body. Falls back to `error.message` + request id when absent. */
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
	{:else}
		<p>{error.message}</p>
		{#if error.requestId !== undefined}
			<small class="request-id">
				{m.shared_error_request_id_label({ requestId: error.requestId })}
			</small>
		{/if}
	{/if}

	<footer class="actions">
		{#if actions}
			{@render actions(error, status)}
		{:else if error.code === 'NOT_FOUND'}
			<a href={resolve('/')} role="button" class="secondary">
				{m.app_action_back_to_top()}
			</a>
		{:else if error.code === 'NETWORK' || error.code === 'TIMEOUT'}
			<button type="button" onclick={reload}>{m.app_action_retry()}</button>
			<a href={resolve('/')} role="button" class="secondary">
				{m.app_action_back_to_top()}
			</a>
		{:else if error.code === 'RATE_LIMIT'}
			<p>
				{#if error.retryAfterSec !== undefined}
					{m.shared_error_rate_limit_body_with_seconds({ seconds: error.retryAfterSec })}
				{:else}
					{m.shared_error_rate_limit_body()}
				{/if}
			</p>
			<a href={resolve('/')} role="button" class="secondary">
				{m.app_action_back_to_top()}
			</a>
		{:else}
			<a href={resolve('/')} role="button" class="secondary">
				{m.app_action_back_to_top()}
			</a>
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

	.request-id {
		display: block;
		margin-top: 0.5rem;
		opacity: 0.7;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
