import { goto } from '$app/navigation';
import { page as pageState } from '$app/state';

/**
 * True when the target resolves to the current URL. Callers use this to no-op
 * redundant navigations: empty re-search, clicking the current page, or
 * clearing already-empty filters.
 */
function isCurrentUrl(url: URL | string): boolean {
	const target = typeof url === 'string' ? new URL(url, pageState.url).href : url.href;
	return target === pageState.url.href;
}

/**
 * Client-only SvelteKit navigate that **adds** a history entry. Use for
 * cases where browser-back should return here (Pagination, sort, submit).
 * Callers pass a fully-resolved `URL` built from `pageState.url`.
 */
export function pushNavigate(url: URL | string): void {
	if (isCurrentUrl(url)) return;
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL is pre-resolved by the caller (pageState.url-based)
	void goto(url, { replaceState: false });
}

/**
 * Client-only SvelteKit navigate that **replaces** the current history
 * entry. Use for transient navigations (debounced `q`, auto-clamp, etc.).
 * `keepFocus` preserves `activeElement` (input typing); `noScroll` prevents
 * jumping to the top on each keystroke.
 */
export function replaceNavigate(url: URL | string): void {
	if (isCurrentUrl(url)) return;
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL is pre-resolved by the caller (pageState.url-based)
	void goto(url, { replaceState: true, keepFocus: true, noScroll: true });
}
