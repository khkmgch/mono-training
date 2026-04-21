<script lang="ts">
	let a = $state(1);
	let b = $state(2);
</script>

<div>
	<label>
		<input type="number" bind:value={a} min="0" max="10" />
		<input type="range" bind:value={a} min="0" max="10" />
	</label>

	<label>
		<input type="number" bind:value={b} min="0" max="10" />
		<input type="range" bind:value={b} min="0" max="10" />
	</label>
</div>

<p>{a} + {b} = {a + b}</p>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
