<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';

	let value = $state(`Some words are *italic*, some are **bold**\n\n- lists\n- are\n- cool`);
</script>

<div class="grid">
	input
	<textarea bind:value></textarea>

	output
	{#await marked.parse(value) then html}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by DOMPurify -->
		<div>{@html DOMPurify.sanitize(html)}</div>
	{/await}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: 5em 1fr;
		grid-template-rows: 1fr 1fr;
		grid-gap: 1em;
		height: 100%;
	}

	textarea {
		flex: 1;
		resize: none;
	}
</style>
