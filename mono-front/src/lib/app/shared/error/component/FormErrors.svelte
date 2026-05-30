<script lang="ts">
	import FormBanner from './FormBanner.svelte';
	import ConflictBanner from './ConflictBanner.svelte';

	type Props = {
		/** Form-level error received via `form?.error`. */
		error: App.Error | undefined;
	};

	let { error }: Props = $props();
</script>

<!-- Both banners self-gate by `error.code`, so callers don't branch. -->
<FormBanner {error} />
<ConflictBanner {error} />
