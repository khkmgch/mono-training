/**
 * Resolve a request path into a fully-qualified `URL`.
 *
 * @remarks
 * - A `URL` instance is returned unchanged.
 * - An absolute string (anything `new URL(path)` can parse without a base) is returned
 *   as a fresh `URL`, with `baseURL` ignored.
 * - A relative string is resolved against `baseURL` via `new URL(path, baseURL)`.
 *   Standard WHATWG semantics apply: a leading `/` discards the base's path, and a
 *   trailing `/` on the base is significant when the path has no leading slash.
 * - Throws `TypeError` when `path` is relative and `baseURL` is missing or unparseable.
 */
export function resolveUrl(path: string | URL, baseURL?: string | URL): URL {
	if (path instanceof URL) {
		return path;
	}
	if (isAbsoluteUrl(path)) {
		return new URL(path);
	}
	if (baseURL === undefined) {
		throw new TypeError(`Cannot resolve relative path "${path}" without a baseURL`);
	}
	return new URL(path, baseURL);
}

function isAbsoluteUrl(path: string): boolean {
	try {
		new URL(path);
		return true;
	} catch {
		return false;
	}
}
