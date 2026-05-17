import type { SortState } from './types';

/**
 * Parse a single URL sort entry into a {@link SortState}. Pure function — never throws.
 *
 * @remarks Format: `<field>,<direction>` where direction is `'asc' | 'desc'`
 *   (case-sensitive). Returns `undefined` for empty field, missing direction,
 *   or unknown direction value. Side-effect free by design: callers
 *   (`createListBinding.parse`) decide whether to emit dev warnings for dropped
 *   entries.
 */
export function parseSortString(raw: string): SortState | undefined {
	// JS split keeps at most `limit` parts (unlike Python which keeps all and
	// returns extras in the last). Field names with commas are unsupported and
	// rejected by the backend allowlist anyway.
	const parts = raw.split(',', 2);
	if (parts.length < 2) return undefined;
	const [field, direction] = parts;
	if (field === '') return undefined;
	if (direction !== 'asc' && direction !== 'desc') return undefined;
	return { field, direction };
}
