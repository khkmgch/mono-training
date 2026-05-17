import type { ListQuery, PageResult } from '$lib/core/list';
import type { Query } from '$lib/core/http';

/**
 * Tag for a custom URL search-param's parsed shape. Used by
 * {@link SearchParamsSchema} to drive parsing / serialization. Built-in params
 * (`page`, `size`, `sort`, `q`) are not declared here — only feature-specific
 * filters like `status`, `tier`, `kind`.
 */
export type SearchParamsSchemaField = 'string' | 'string[]' | 'number' | 'number[]' | 'boolean';

/**
 * Schema declaration for feature-specific URL search params. The schema is the
 * single source of truth: the parsed value shape is **derived** from the field
 * tags via {@link SearchParamsShape} (no double declaration).
 *
 * @example
 *   const schema = { status: 'string', tier: 'number[]' } satisfies SearchParamsSchema;
 *   // SearchParamsShape<typeof schema> =
 *   //   { readonly status: string | undefined; readonly tier: readonly number[] }
 */
export type SearchParamsSchema = Readonly<Record<string, SearchParamsSchemaField>>;

/**
 * Map a single schema field tag to its parsed TypeScript type.
 *
 * @remarks Scalars default to `undefined` when the URL key is absent or
 *   invalid; array fields default to `readonly []`. Aligned with the
 *   Nuqs / Refine convention: "optional is scalar, always-present is array".
 */
export type ParsedSearchParam<F extends SearchParamsSchemaField> = F extends 'string'
	? string | undefined
	: F extends 'string[]'
		? readonly string[]
		: F extends 'number'
			? number | undefined
			: F extends 'number[]'
				? readonly number[]
				: F extends 'boolean'
					? boolean | undefined
					: never;

/**
 * Derive the parsed value shape from a schema by mapping each field tag through
 * {@link ParsedSearchParam}.
 */
export type SearchParamsShape<S extends SearchParamsSchema> = {
	readonly [K in keyof S]: ParsedSearchParam<S[K]>;
};

/**
 * The full parsed list query: universal params (`page` / `size` / `sort` / `q`)
 * plus the feature-specific custom params **derived from the schema**, grouped
 * under `searchParams`. Naming aligns with the Web standard `URLSearchParams`.
 */
export type ListQueryWithSearchParams<S extends SearchParamsSchema> = ListQuery & {
	readonly searchParams: SearchParamsShape<S>;
};

/**
 * Single source of truth for a list's URL contract. Produced by `createListBinding`.
 * The same `ListBinding` instance is consumed by `ListProvider`, `SearchForm`,
 * and `DataTable` via context — call sites import the binding once and pass it
 * to `<ListProvider>`.
 */
export type ListBinding<S extends SearchParamsSchema> = Readonly<{
	/** Schema of feature-specific URL search params. */
	searchParams: S;

	/**
	 * Parse a URL into the full list query. Lenient for built-in params
	 * (`page` / `size` / `sort` / `q`) — invalid values fall back to defaults
	 * with a dev warning. Strict for `searchParams.*` — invalid values are
	 * dropped per the field tag (also with a dev warning) and never throw.
	 *
	 * Safe to call from both `+page.server.ts` and client code (no implicit
	 * state read — the URL is the explicit argument).
	 */
	parse: (url: URL) => ListQueryWithSearchParams<S>;

	/**
	 * Serialize the parsed query into the `Query` shape expected by `core/http`.
	 * Empty strings / `undefined` scalars / empty arrays are omitted from the
	 * wire; `0` and `false` are sent as values (explicit "send false" must
	 * remain expressible).
	 */
	toBackendQuery: (q: ListQueryWithSearchParams<S>) => Query;

	/**
	 * `{'page', 'size', 'sort', 'q'} ∪ keys(searchParams)` — URL keys "owned"
	 * by this list. Used internally to decide which keys are preserved versus
	 * managed when building navigation URLs.
	 */
	ownedKeys: ReadonlySet<string>;

	/**
	 * Keys that SearchForm intentionally drops on submit. Default = `{'page'}`
	 * (filter changes reset pagination but preserve `size` / `sort` / non-owned
	 * keys). Override via `createListBinding({ resetOnSubmit: [...] })`.
	 */
	resetOnSubmitKeys: ReadonlySet<string>;

	/**
	 * Build `URLSearchParams` for a navigation. Preserves non-owned URL keys
	 * (e.g. `theme`, `locale`, `flash`) from the current page URL.
	 *
	 * **Client-only.** Reads `$app/state.page.url`. Throws when invoked under
	 * SSR (`browser === false`).
	 */
	toUrlSearchParams: (q: Partial<ListQueryWithSearchParams<S>>) => URLSearchParams;

	/**
	 * Returns a navigate function bound to this binding. Changes to
	 * `q` / `searchParams` (without explicit `page`) auto-reset page to `0`.
	 * Default is push (history entry added); pass `{ replace: true }` for
	 * replaceState.
	 *
	 * **Client-only** — the returned function calls `goto` from
	 * `$app/navigation`, which throws on the server.
	 *
	 * @remarks Call this once at the consumer's `<script>` top-level and reuse
	 *   the returned function — Snippet-scoped `{@const}` creates a fresh
	 *   function on every re-render and breaks the stable-reference contract.
	 */
	createNavigate: (options?: {
		replace?: boolean;
	}) => (next: Partial<ListQueryWithSearchParams<S>>) => void;

	/**
	 * Same as `createNavigate` but debounces the call (default 300ms), always
	 * `replaceState: true`, `keepFocus: true`, `noScroll: true`. For `oninput`
	 * on a free-text `q`.
	 *
	 * **Client-only** — same reasoning as `createNavigate`.
	 *
	 * @remarks **MUST be called once at `<script>` top-level.** Each call
	 *   creates a fresh closure with its own internal timer; calling inside a
	 *   Snippet's `{@const}` resets the timer on every re-render and defeats
	 *   the debounce.
	 */
	createDebouncedNavigate: (options?: {
		delay?: number;
	}) => (next: Partial<ListQueryWithSearchParams<S>>) => void;
}>;

/**
 * Context shared between `<SearchForm>` and `<DataTable>` via `<ListProvider>`.
 * All three reference the same `binding`, the same parsed `query`, and the
 * same `result` — the mental model is "the inputs in this Provider belong to
 * the adjacent table".
 *
 * @remarks `result.items` is typed as `unknown[]` at the context layer; the
 *   consumer (`<DataTable>`) narrows via its `TRow` generic.
 */
export type ListContext<S extends SearchParamsSchema> = Readonly<{
	binding: ListBinding<S>;
	query: ListQueryWithSearchParams<S>;
	result: PageResult<unknown>;
}>;

/**
 * Argument passed to the `<SearchForm>` `searchControls` Snippet. Exposes the
 * full context so the consumer can call e.g. `binding.createDebouncedNavigate()`
 * without prop drilling.
 */
export type SearchControlsContext<S extends SearchParamsSchema> = ListContext<S>;

/**
 * Pure data context describing an out-of-range page request.
 */
export type OutOfRangeContext = Readonly<{
	/** The requested page (echoed by the backend, may exceed `totalPages - 1`). */
	page: number;
	/** Server-reported `totalPages`. */
	totalPages: number;
	/** Safe last page index (`totalPages - 1`, clamped at `0`). */
	clampTo: number;
}>;

/**
 * Argument passed to the `outOfRange` Snippet on `<DataTable>`. Extends
 * {@link OutOfRangeContext} with a `navigate` callback supplied by DataTable;
 * `navigate` always uses `replaceState: true` (out-of-range URLs must not
 * enter history).
 */
export type OutOfRangeSnippetContext = OutOfRangeContext & {
	navigate: (page: number) => void;
};
