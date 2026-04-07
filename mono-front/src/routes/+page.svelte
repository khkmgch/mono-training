<script lang="ts">
	import ExerciseCard from '$lib/domain/tutorial/components/ExerciseCard.svelte';
	import { chapters } from '$lib/domain/tutorial/registry/chapters';

	let selectedChapterId = $state(chapters[0].id);

	let selectedChapter = $derived(chapters.find((c) => c.id === selectedChapterId) ?? chapters[0]);
</script>

<svelte:head>
	<title>Tutorial - Mono Training</title>
</svelte:head>

<div class="tutorial-layout">
	<nav aria-label="Chapter navigation">
		{#each chapters as chapter (chapter.id)}
			<button
				onclick={() => (selectedChapterId = chapter.id)}
				aria-current={selectedChapterId === chapter.id ? 'true' : undefined}
			>
				{chapter.label}
			</button>
		{/each}
	</nav>

	<main>
		{#each selectedChapter.exercises as exercise (exercise.id)}
			{@const ExComp = exercise.component}
			<ExerciseCard title={exercise.title} docUrl={exercise.docUrl}>
				<ExComp />
			</ExerciseCard>
		{/each}
	</main>
</div>

<style>
	.tutorial-layout {
		display: grid;
		grid-template-columns: 200px 1fr;
		flex: 1;
		overflow: hidden;
		max-width: 960px;
		width: 100%;
		margin: 0 auto;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem 0.5rem;
		border-right: 1px solid var(--color-border);
	}

	nav button {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		text-align: left;
		color: inherit;
		background: none;
		border: none;
		cursor: pointer;
	}

	nav button[aria-current='true'] {
		font-weight: bold;
	}

	nav button:hover,
	nav button:focus-visible {
		background-color: var(--color-surface-hover);
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		overflow-y: auto;
	}

	@media (max-width: 767px) {
		.tutorial-layout {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
		}

		nav {
			flex-direction: row;
			padding: 0.5rem;
			border-right: none;
			border-bottom: 1px solid var(--color-border);
			overflow-x: auto;
		}

		nav button {
			white-space: nowrap;
		}
	}
</style>
