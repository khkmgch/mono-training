import type { Query, QueryValue } from './types';

/**
 * Append query parameters to a URL, returning a new `URL` instance.
 *
 * @remarks
 * - `null` / `undefined` values are skipped (use them to omit a key without conditionals).
 * - Array values become repeated keys (`role=admin&role=editor`).
 * - Existing query parameters on `url` are preserved.
 * - Special characters are URL-encoded by `URLSearchParams`.
 *
 * @example
 * ```ts
 * appendQuery(new URL('https://x.test/p'), { active: true, role: ['admin', 'editor'], cursor: null });
 * // → https://x.test/p?active=true&role=admin&role=editor
 * ```
 */
export function appendQuery(url: URL, query?: Query): URL {
	if (query === undefined) return url;

	const result = new URL(url);
	for (const [key, value] of Object.entries(query)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				appendIfPresent(result.searchParams, key, item);
			}
		} else {
			appendIfPresent(result.searchParams, key, value as QueryValue);
		}
	}
	return result;
}

function appendIfPresent(params: URLSearchParams, key: string, value: QueryValue): void {
	if (value === null || value === undefined) return;
	params.append(key, String(value));
}
