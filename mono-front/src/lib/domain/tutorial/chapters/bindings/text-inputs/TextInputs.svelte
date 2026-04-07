<script lang="ts">
	let name = $state('world');
</script>

<input bind:value={name} />

<h1>Hello {name}!</h1>
