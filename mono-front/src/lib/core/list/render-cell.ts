/**
 * Default cell renderer when a column provides no `cell` Snippet.
 *
 * @remarks `null` / `undefined` / `NaN` are coerced to `''` (never the literal
 *   `'null'` / `'undefined'` / `'NaN'`). `Infinity` / `-Infinity` pass through —
 *   only `NaN` is suppressed because it usually stems from arithmetic on
 *   missing data, where rendering it as text would be wrong.
 */
export function renderCellValue(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'number' && Number.isNaN(value)) return '';
	// NOSONAR(typescript:S6551) — objects intentionally coerce to '[object Object]';
	// consumers needing richer formatting must supply a `cell` Snippet on the column.
	return String(value);
}
