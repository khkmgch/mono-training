<script lang="ts">
	import ExerciseCard from '$lib/app/feature/tutorial/component/ExerciseCard.svelte';
	import { chapters } from '$lib/app/feature/tutorial/registry/chapters';

	let selectedChapterId = $state(chapters[0].id);

	let selectedChapter = $derived(chapters.find((c) => c.id === selectedChapterId) ?? chapters[0]);
</script>

<svelte:head>
	<title>Tutorial - Mono Training</title>
</svelte:head>

<div class="tutorial-layout">
	<aside class="chapter-sidebar">
		<nav aria-label="Chapter navigation">
			<ul>
				{#each chapters as chapter (chapter.id)}
					<li>
						<button
							onclick={() => (selectedChapterId = chapter.id)}
							aria-current={selectedChapterId === chapter.id ? 'true' : undefined}
						>
							{chapter.label}
						</button>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>

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
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
	}

	.chapter-sidebar {
		border-right: 1px solid var(--pico-muted-border-color);
	}

	.chapter-sidebar nav ul {
		margin: 0;
	}

	.chapter-sidebar nav button {
		width: 100%;
		text-align: left;
		color: inherit;
		background: none;
		border: none;
		--pico-primary-focus: var(--pico-secondary-focus);
	}

	.chapter-sidebar nav button[aria-current='true'] {
		font-weight: bold;
	}

	.chapter-sidebar nav button:hover,
	.chapter-sidebar nav button:focus-visible {
		background-color: var(--pico-card-sectioning-background-color);
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

		.chapter-sidebar {
			border-right: none;
			border-bottom: 1px solid var(--pico-muted-border-color);
			overflow-x: auto;
		}

		.chapter-sidebar nav ul {
			display: flex;
			flex-wrap: nowrap;
		}

		.chapter-sidebar nav li {
			flex-shrink: 0;
		}

		.chapter-sidebar nav button {
			white-space: nowrap;
		}
	}
</style>
