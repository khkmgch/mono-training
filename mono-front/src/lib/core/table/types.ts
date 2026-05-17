import type { Snippet } from 'svelte';

/**
 * Column definition for `<Table>`.
 *
 * Uses a discriminated union over `header` to enforce `label` at compile time:
 * - `header: string` → `label` is optional (the string doubles as SR identifier).
 * - `header: Snippet<[]>` → `label` is **required** (TS error when omitted); used
 *   for sort `aria-label`, dev warnings, and any other place that needs a plain
 *   string identifier for the column.
 *
 * @remarks `column.id` (or `column.sortKey ?? column.id`) is sent verbatim to the
 *   backend as `?sort=<key>,<dir>`. The value MUST appear in the backend
 *   `SORTABLE_FIELDS` allowlist; otherwise the request is rejected with HTTP 400.
 */
export type Column<R> = (
	| { header: string; label?: string }
	| { header: Snippet<[]>; label: string }
) & {
	/**
	 * Stable per-row column identifier. Used as the `{#each}` key, the default
	 * sort field name, and the dev-mode duplicate-id check.
	 */
	id: string;
	/** Pure projection from row to a primitive value. `cell` overrides this for display. */
	accessor?: (row: R) => unknown;
	/**
	 * Cell renderer. The `column` argument is `Omit<Column<R>, 'cell'>` so callers
	 * can safely read sibling fields (e.g., `column.id`) without re-entering the
	 * `cell` Snippet from inside itself.
	 */
	cell?: Snippet<
		[
			{
				row: R;
				column: Omit<Column<R>, 'cell'>;
				value: unknown;
				index: number;
			}
		]
	>;
	sortable?: boolean;
	/** Defaults to `id`. Sent to the backend as `?sort=<sortKey>,<dir>`. */
	sortKey?: string;
	/**
	 * Column width forwarded to `<col style:width>`. A `number` is normalized to
	 * `${n}px` (Svelte does not auto-append units); a `string` is passed as-is
	 * (any CSS length / percentage).
	 */
	width?: string | number;
	headerClass?: string;
	cellClass?: string;
};
