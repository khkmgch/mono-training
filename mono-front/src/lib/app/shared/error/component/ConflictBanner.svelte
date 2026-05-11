<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';

	type Props = {
		/** Form-level error received via `form?.error`. */
		error: App.Error | undefined;
	};

	let { error }: Props = $props();

	const visible = $derived(error?.code === 'CONFLICT_VERSION');
</script>

{#if visible}
	<article role="alert" class="conflict-banner">
		<strong>{m.shared_error_conflict_version_title()}</strong>
		<p>{m.shared_error_conflict_version_body()}</p>
		<!--
			Reload pattern: focus the only safe action so destructive data loss is not the default
			(WAI-ARIA APG alertdialog guidance: focus the safest choice on destructive operations).
		-->
		<!-- svelte-ignore a11y_autofocus -->
		<button type="button" onclick={() => invalidateAll()} autofocus>
			{m.shared_error_conflict_version_action()}
		</button>
	</article>
{/if}

<style>
	.conflict-banner {
		border-left: 4px solid var(--pico-color-amber-500, #d97706);
	}
</style>
