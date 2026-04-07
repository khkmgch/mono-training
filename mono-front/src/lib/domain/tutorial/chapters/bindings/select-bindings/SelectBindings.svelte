<script lang="ts">
	interface Question {
		id: number;
		text: string;
	}

	let questions: Question[] = [
		{
			id: 1,
			text: `Where did you go to school?`
		},
		{
			id: 2,
			text: `What is your mother's name?`
		},
		{
			id: 3,
			text: `What is another personal fact that an attacker could easily find with Google?`
		}
	];

	let selected: Question | undefined = $state();

	let answer = $state('');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!selected) {
			alert('Please select a question');
			return;
		}

		alert(`answered question ${selected.id} (${selected.text}) with "${answer}"`);
	}
</script>

<h2>Insecurity questions</h2>

<form onsubmit={handleSubmit}>
	<select bind:value={selected} onchange={() => (answer = '')}>
		{#each questions as question (question.id)}
			<option value={question}>
				{question.text}
			</option>
		{/each}
	</select>

	<input bind:value={answer} />

	<button disabled={!answer} type="submit"> Submit </button>
</form>

<p>
	selected question {selected ? selected.id : '[waiting...]'}
</p>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	select,
	input,
	button {
		width: fit-content;
	}
</style>
