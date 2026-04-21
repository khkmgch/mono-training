<script lang="ts">
	import DOMPurify from 'isomorphic-dompurify';

	let string = DOMPurify.sanitize(`this string contains some <strong>HTML!!!</strong>`);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by DOMPurify -->
<p>{@html string}</p>
