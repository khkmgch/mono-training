// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export type {
	ListBinding,
	ListContext,
	ListQueryWithSearchParams,
	OutOfRangeContext,
	OutOfRangeSnippetContext,
	ParsedSearchParam,
	SearchControlsContext,
	SearchParamsSchema,
	SearchParamsSchemaField,
	SearchParamsShape
} from './types';

// ─────────────────────────────────────────────────────────────────────
// Factory + context
// ─────────────────────────────────────────────────────────────────────

export { createListBinding } from './binding';
export { getListContext } from './context';

// ─────────────────────────────────────────────────────────────────────
// Default labels (paraglide-backed)
// ─────────────────────────────────────────────────────────────────────

export { DEFAULT_PAGINATION_LABELS, defaultSortAriaLabel } from './default-labels';

// ─────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────

export { default as ListProvider } from './component/ListProvider.svelte';
export { default as SearchForm } from './component/SearchForm.svelte';
export { default as DataTable } from './component/DataTable.svelte';
export { default as DefaultEmpty } from './component/DefaultEmpty.svelte';
export { default as DefaultOutOfRange } from './component/DefaultOutOfRange.svelte';
