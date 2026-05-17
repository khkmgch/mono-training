import { goto } from '$app/navigation';

/**
 * SvelteKit navigate that **adds** a history entry. Use for the
 * "user wants browser back to return here" cases (Pagination click, sort click,
 * SearchForm submit).
 *
 * @remarks **Client-only.** `goto` throws under SSR.
 *
 * @remarks Callers pass a fully-formed `URL` (built from `pageState.url`), so
 *   base-path resolution is already baked in — `$app/paths.resolve` is not used.
 */
export function pushNavigate(url: URL | string): void {
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL is pre-resolved by the caller (pageState.url-based)
	void goto(url, { replaceState: false });
}

/**
 * SvelteKit navigate that **replaces** the current history entry. Use for
 * transient navigations where adding a history entry would be noisy: debounced
 * `q` input on keystroke, auto-clamp out-of-range page, outOfRange Snippet's
 * manual navigate.
 *
 * @remarks `keepFocus: true` preserves the `document.activeElement` reference
 *   across the navigation (essential while the user is typing into an input).
 *   `noScroll: true` prevents the page from jumping to the top on each
 *   keystroke.
 *
 * @remarks **Client-only.** `goto` throws under SSR.
 *
 * @remarks Callers pass a fully-formed `URL`; see {@link pushNavigate}.
 */
export function replaceNavigate(url: URL | string): void {
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL is pre-resolved by the caller (pageState.url-based)
	void goto(url, { replaceState: true, keepFocus: true, noScroll: true });
}
