<script lang="ts" generics="S extends SearchParamsSchema">
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page as pageState } from '$app/state';

	import { getListContext } from '../context';
	import type { SearchControlsContext, SearchParamsSchema } from '../types';

	type Props = {
		/** Accessible name for the `<search>` landmark. Required (exactly one of label/labelledby). */
		'aria-label'?: string;
		/** Reference to a heading id, alternative to `aria-label`. */
		'aria-labelledby'?: string;
		/**
		 * Wrapper element. Default `'search'` (Safari 17+, Chrome 118+, Firefox 118+).
		 * Switch to `'div'` (renders `<div role="search">`) for compat or when the
		 * outer page already provides a search landmark.
		 */
		searchElement?: 'search' | 'div';
		/**
		 * Render the input region. Receives the full {@link SearchControlsContext}
		 * so the consumer can read current values, build input `name` attributes,
		 * and call `binding.createDebouncedNavigate()` directly.
		 *
		 * @remarks **User MUST include `<button type="submit">` inside this Snippet.**
		 *   SearchForm does NOT auto-append a default submit button.
		 */
		searchControls: Snippet<[SearchControlsContext<S>]>;
	};

	let {
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		searchElement = 'search',
		searchControls
	}: Props = $props();

	const ctx = getListContext<S>();

	let formEl: HTMLFormElement | undefined = $state(undefined);
	// Use SvelteSet so $state tracks the contents (Svelte 5 — `Set` itself is not reactive).
	const formFieldNames = new SvelteSet<string>();

	$effect(() => {
		if (ariaLabel === undefined && ariaLabelledBy === undefined) {
			console.error('[SearchForm] Exactly one of `aria-label` or `aria-labelledby` is required.');
		} else if (ariaLabel !== undefined && ariaLabelledBy !== undefined) {
			console.warn(
				'[SearchForm] Both `aria-label` and `aria-labelledby` were provided; prefer one.'
			);
		}
	});

	// DOM scan after mount — pick up the `name` of every visible form input the
	// searchControls Snippet renders. The selector excludes `type="hidden"` so the
	// SearchForm's own preserved-key hidden inputs (rendered below) are not folded
	// back into `formFieldNames`. Snippets are black boxes from Svelte's view, so
	// we have to read the DOM once formEl is bound.
	$effect(() => {
		if (formEl === undefined) return;
		formFieldNames.clear();
		formEl
			.querySelectorAll('input:not([type="hidden"])[name], select[name], textarea[name]')
			.forEach((node) => {
				const name = (node as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name;
				if (name !== '') formFieldNames.add(name);
			});
	});

	// Reactive: every navigation updates pageState.url; formFieldNames is mount-stable.
	const hiddenEntries = $derived.by(() => {
		const params = pageState.url.searchParams;
		const entries: { key: string; value: string }[] = [];
		for (const key of new Set(params.keys())) {
			if (formFieldNames.has(key)) continue; // user's form data overrides
			if (ctx.binding.resetOnSubmitKeys.has(key)) continue; // intentionally dropped on submit
			for (const value of params.getAll(key)) {
				entries.push({ key, value });
			}
		}
		return entries;
	});
</script>

{#if searchElement === 'search'}
	<search aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}>
		<form bind:this={formEl} method="GET">
			{@render searchControls(ctx)}
			{#each hiddenEntries as entry, i (`${entry.key}-${i}`)}
				<input type="hidden" name={entry.key} value={entry.value} />
			{/each}
		</form>
	</search>
{:else}
	<div role="search" aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}>
		<form bind:this={formEl} method="GET">
			{@render searchControls(ctx)}
			{#each hiddenEntries as entry, i (`${entry.key}-${i}`)}
				<input type="hidden" name={entry.key} value={entry.value} />
			{/each}
		</form>
	</div>
{/if}
