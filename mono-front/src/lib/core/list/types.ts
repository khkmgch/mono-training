/**
 * Sort direction in the URL representation `?sort=<field>,<direction>`.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * A single sort entry. Multi-column sort is expressed as an ordered list of
 * `SortState` (the URL repeats `?sort=...` per entry).
 */
export type SortState = Readonly<{
	field: string;
	direction: SortDirection;
}>;

/**
 * Paginated list response. Mirrors the backend `PagedResponse<T>` record.
 *
 * @remarks
 * - `page` is **0-based**. The backend echoes the requested `page` even when it
 *   exceeds `totalPages - 1` (out-of-range echo), so consumers must treat this
 *   field as "what was requested" rather than "what was found".
 * - `totalPages = Math.ceil(totalCount / size)` (backend-computed).
 * - `totalCount === 0` implies `items === []` and `totalPages === 0`.
 */
export type PageResult<TRow> = Readonly<{
	items: readonly TRow[];
	page: number;
	size: number;
	totalCount: number;
	totalPages: number;
}>;

/**
 * Universal list query parsed from the URL. Backend-agnostic and contains no
 * feature-specific filters — feature filters are layered on top via
 * `searchParams` in `ListQueryWithSearchParams<S>` (app/shared/ui/list).
 *
 * @remarks `q` is `undefined` (never the empty string) when absent or empty.
 */
export type ListQuery = Readonly<{
	page: number;
	size: number;
	sort: readonly SortState[];
	q: string | undefined;
}>;
