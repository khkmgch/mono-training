<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';

	import ExerciseCard from '$lib/app/feature/tutorial/component/ExerciseCard.svelte';
	import { chapters } from '$lib/app/feature/tutorial/registry/chapters';

	const selectedChapter = $derived(
		chapters.find((c) => c.id === page.url.searchParams.get('chapter')) ?? chapters[0]
	);
	const selectedChapterId = $derived(selectedChapter.id);

	function selectChapter(id: string): void {
		// Clone page.url to preserve base path.
		const url = new URL(page.url);
		url.searchParams.set('chapter', id);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL is pre-resolved (page.url-based)
		void goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	}
</script>

<svelte:head>
	<title>{m.app_nav_tutorial()} - Mono Training</title>
</svelte:head>

<div class="page tutorial-shell">
	<aside class="chapter-sidebar" aria-label={m.app_nav_tutorial_chapters_label()}>
		<nav>
			<ul>
				{#each chapters as chapter (chapter.id)}
					<li>
						<button
							type="button"
							onclick={() => selectChapter(chapter.id)}
							aria-current={selectedChapterId === chapter.id ? 'true' : undefined}
						>
							{chapter.label}
						</button>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>

	<div class="tutorial-content">
		{#each selectedChapter.exercises as exercise (exercise.id)}
			{@const ExComp = exercise.component}
			<ExerciseCard title={exercise.title} docUrl={exercise.docUrl}>
				<ExComp />
			</ExerciseCard>
		{/each}
	</div>
</div>

<style>
	.tutorial-shell {
		display: grid;
		/* Cap content column for readability; center inside .page. */
		grid-template-columns: var(--ds-sidebar-w) minmax(0, 880px);
		gap: var(--ds-space-6);
		justify-content: center;
	}

	.tutorial-shell > * {
		min-width: 0;
	}

	.chapter-sidebar {
		padding-right: var(--ds-space-3);
		border-right: 1px solid var(--ds-border-subtle);
	}

	.chapter-sidebar nav ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chapter-sidebar nav button {
		width: 100%;
		padding: var(--ds-space-2) var(--ds-space-3);
		text-align: left;
		color: inherit;
		background: none;
		border: 0;
		border-radius: var(--pico-border-radius);
		transition: background-color var(--ds-duration-fast) var(--ds-ease);
	}

	.chapter-sidebar nav button:hover {
		background-color: var(--ds-surface-hover);
	}

	.chapter-sidebar nav button:focus-visible {
		outline: 2px solid var(--ds-color-accent-focus);
		outline-offset: 2px;
	}

	.chapter-sidebar nav button[aria-current='true'] {
		font-weight: 600;
		background-color: var(--ds-surface-section);
		box-shadow: inset 4px 0 0 var(--ds-color-accent);
	}

	.tutorial-content {
		display: flex;
		flex-direction: column;
		gap: var(--ds-space-4);
	}

	@media (max-width: 767px) {
		.tutorial-shell {
			grid-template-columns: 1fr;
		}

		.chapter-sidebar {
			padding: 0 0 var(--ds-space-2);
			border-right: 0;
			border-bottom: 1px solid var(--ds-border-subtle);
		}

		.chapter-sidebar nav ul {
			display: flex;
			flex-wrap: nowrap;
			overflow-x: auto;
		}

		.chapter-sidebar nav li {
			flex-shrink: 0;
		}

		.chapter-sidebar nav button {
			white-space: nowrap;
		}
	}
</style>
