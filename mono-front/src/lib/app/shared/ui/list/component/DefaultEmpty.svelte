<script lang="ts">
	import * as m from '$lib/paraglide/messages';
</script>

<p class="ds-list-empty">{m.list_empty()}</p>

<style>
	.ds-list-empty {
		text-align: center;
		padding: 1.5rem 1rem;
		color: var(--ds-list-empty-color, currentColor);
		opacity: 0.7;
	}
</style>
