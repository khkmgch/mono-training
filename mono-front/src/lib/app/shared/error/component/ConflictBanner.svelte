<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';

	type Props = {
		/** Form-level error received via `form?.error`. */
		error: App.Error | undefined;
	};

	let { error }: Props = $props();

	const visible = $derived(error?.code === 'CONFLICT_VERSION');

	let reloading = $state(false);

	// Re-fetch the latest data AND drop the stale submission. Navigating resets the sticky `form`
	// (so this banner and the outdated field values disappear and the version is refreshed), while
	// `invalidateAll` re-runs the load. `invalidateAll()` alone refreshes the data but leaves `form`
	// set, so nothing visible would change.
	async function reloadLatest(): Promise<void> {
		reloading = true;
		try {
			await goto(page.url, { invalidateAll: true, noScroll: true });
		} finally {
			reloading = false;
		}
	}
</script>

{#if visible}
	<article role="alert" class="conflict-banner">
		<strong>{m.shared_error_conflict_version_title()}</strong>
		<p>{m.shared_error_conflict_version_body()}</p>
		<!-- svelte-ignore a11y_autofocus -->
		<button type="button" onclick={reloadLatest} disabled={reloading} autofocus>
			{m.shared_error_conflict_version_action()}
		</button>
	</article>
{/if}

<style>
	.conflict-banner {
		border-left: 4px solid var(--ds-color-warning);
	}
</style>
