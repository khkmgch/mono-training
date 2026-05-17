import * as m from '$lib/paraglide/messages';

import type { SortDirection } from '$lib/core/list';
import type { PaginationLabels } from '$lib/core/pagination';
import type { Column } from '$lib/core/table';

/**
 * Project-default {@link PaginationLabels} backed by paraglide-js.
 *
 * @remarks paraglide v2 message functions read `getLocale()` at invocation
 *   time, so wrapping each label in a getter ensures locale switches
 *   (URL/cookie strategy, or `setLocale({ reload: true })`) propagate to the
 *   next read. paraglide is not Svelte-runes-based; propagation relies on
 *   navigation or explicit reload.
 *
 * @example
 *   <DataTable labels={DEFAULT_PAGINATION_LABELS} ... />
 *   <DataTable labels={{ ...DEFAULT_PAGINATION_LABELS, nav: 'ユーザー一覧' }} ... />
 */
export const DEFAULT_PAGINATION_LABELS: PaginationLabels = {
	get nav() {
		return m.list_pagination_nav();
	},
	get previousPage() {
		return m.list_pagination_previous();
	},
	get nextPage() {
		return m.list_pagination_next();
	},
	page: (n: number) => m.list_pagination_page({ n })
};

/**
 * Default `sortAriaLabel` for `<DataTable>` / `<Table>`. Uses the column's
 * `label` when provided, falling back to the string `header` and then `id`.
 */
export function defaultSortAriaLabel<R>(col: Column<R>, dir: SortDirection | 'none'): string {
	const columnLabel = col.label ?? (typeof col.header === 'string' ? col.header : col.id);
	return m.list_sort_aria_label({ column: columnLabel, direction: dir });
}
