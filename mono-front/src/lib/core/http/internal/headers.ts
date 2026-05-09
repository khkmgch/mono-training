/**
 * Merge multiple `HeadersInit` sources into a single `Headers` instance.
 *
 * @remarks
 * - Sources are applied in order; later sources overwrite earlier ones.
 *   Pass `defaultHeaders` first and per-request headers last to get the conventional
 *   "per-request overrides default" behavior.
 * - `undefined` sources are skipped, so callers can pass optional values directly.
 * - Header names are matched case-insensitively (per the `Headers` spec).
 * - There is no "delete via `undefined` value" semantic — `HeadersInit`'s `Record`
 *   form already forbids `undefined` values at the type level. To remove a header,
 *   omit the source that sets it.
 */
export function mergeHeaders(...sources: ReadonlyArray<HeadersInit | undefined>): Headers {
	const result = new Headers();
	for (const source of sources) {
		if (source === undefined) continue;
		const headers = source instanceof Headers ? source : new Headers(source);
		headers.forEach((value, key) => {
			result.set(key, value);
		});
	}
	return result;
}
