<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { OutOfRangeSnippetContext } from '../types';

	let { clampTo, navigate }: OutOfRangeSnippetContext = $props();
</script>

<div class="ds-list-out-of-range" role="status">
	<p>{m.list_out_of_range_title()}</p>
	<button type="button" onclick={() => navigate(clampTo)}>
		{m.list_out_of_range_action({ n: clampTo + 1 })}
	</button>
</div>

<style>
	.ds-list-out-of-range {
		text-align: center;
		padding: 1.5rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
</style>
