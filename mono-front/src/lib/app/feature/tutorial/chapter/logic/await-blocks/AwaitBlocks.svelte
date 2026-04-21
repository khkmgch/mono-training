<script lang="ts">
	import { roll } from './utils';

	let promise = $state(roll());
</script>

<button onclick={() => (promise = roll())}> roll the dice </button>

{#await promise}
	<p>Rolling...</p>
{:then number}
	<p>You rolled a {number}</p>
{:catch error}
	<p>Error: {error.message}</p>
{/await}
