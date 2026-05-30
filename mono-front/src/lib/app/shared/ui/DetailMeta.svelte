<script lang="ts">
	export type DetailMetaItem = { label: string; value: string };

	type Props = { items: ReadonlyArray<DetailMetaItem> };

	let { items }: Props = $props();
</script>

<!-- 2-col grid keeps verbose datetimes aligned vertically. -->
<dl class="meta">
	{#each items as item (item.label)}
		<dt>{item.label}</dt>
		<dd>{item.value}</dd>
	{/each}
</dl>

<style>
	.meta {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: var(--ds-space-3);
		row-gap: 0;
		margin: 0;
		color: var(--ds-text-muted);
		font-size: var(--ds-fs-meta);
	}

	.meta dd {
		margin: 0;
		color: var(--ds-text-primary);
	}
</style>
