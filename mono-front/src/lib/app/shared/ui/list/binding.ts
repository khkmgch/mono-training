import { browser } from '$app/environment';
import { page as pageState } from '$app/state';

import {
	DEFAULT_PAGE_SIZE,
	MAX_PAGE_SIZE,
	MAX_Q_LENGTH,
	parseSortString,
	type SortState
} from '$lib/core/list';
import type { Query } from '$lib/core/http';

import { pushNavigate, replaceNavigate } from './navigate-helpers';
import type {
	ListBinding,
	ListQueryWithSearchParams,
	SearchParamsSchema,
	SearchParamsShape
} from './types';

const BUILTIN_KEYS: readonly string[] = ['page', 'size', 'sort', 'q'];

/**
 * Create the single source of truth for a list's URL contract. Call once at the
 * feature module's top level (`export const userListBinding = createListBinding({...})`)
 * and pass the returned binding to `<ListProvider>` — the same reference is
 * preserved across navigations.
 *
 * @remarks SSR-safe: the factory only closes over static config (schema +
 *   resetOnSubmit set). The client-only members (`toUrlSearchParams`,
 *   `createNavigate`, `createDebouncedNavigate`) are guarded — `toUrlSearchParams`
 *   throws explicitly under SSR; the `goto`-using factories throw via
 *   SvelteKit's own server-side guard when invoked.
 *
 * @remarks `const S` (TS 5.0+) makes inline schema literals infer with literal
 *   field tags without requiring `as const` at the call site.
 *
 * @example
 *   export const userListBinding = createListBinding({
 *     searchParams: { status: 'string', tier: 'number[]' }
 *   });
 *   // S = { readonly status: 'string'; readonly tier: 'number[]' }
 *   // query.searchParams.status: string | undefined
 *   // query.searchParams.tier:   readonly number[]
 */
export function createListBinding<
	const S extends SearchParamsSchema = Record<string, never>
>(config?: {
	searchParams?: S;
	resetOnSubmit?: ReadonlyArray<keyof S | 'page' | 'size' | 'sort' | 'q'>;
}): ListBinding<S> {
	const schema = (config?.searchParams ?? ({} as S)) as S;
	const schemaKeys = Object.keys(schema);
	const ownedKeys: ReadonlySet<string> = new Set([...BUILTIN_KEYS, ...schemaKeys]);
	const resetOnSubmitKeys: ReadonlySet<string> = new Set(
		(config?.resetOnSubmit as ReadonlyArray<string> | undefined) ?? ['page']
	);

	function parse(url: URL): ListQueryWithSearchParams<S> {
		return {
			page: parsePage(url.searchParams.get('page')),
			size: parseSize(url.searchParams.get('size')),
			sort: parseSort(url.searchParams.getAll('sort')),
			q: parseQ(url.searchParams.get('q')),
			searchParams: parseSchema(schema, url.searchParams) as SearchParamsShape<S>
		};
	}

	function toBackendQuery(q: ListQueryWithSearchParams<S>): Query {
		const out: Record<string, unknown> = { page: q.page, size: q.size };
		if (q.sort.length > 0) {
			out.sort = q.sort.map((entry) => `${entry.field},${entry.direction}`);
		}
		if (q.q !== undefined && q.q !== '') out.q = q.q;
		for (const [key, value] of Object.entries(q.searchParams)) {
			if (value === undefined) continue;
			if (Array.isArray(value)) {
				if (value.length === 0) continue;
				out[key] = value;
			} else {
				out[key] = value;
			}
		}
		return out as Query;
	}

	function toUrlSearchParams(q: Partial<ListQueryWithSearchParams<S>>): URLSearchParams {
		if (!browser) {
			throw new Error(
				'ListBinding.toUrlSearchParams is client-only. For server-side URL construction, use binding.toBackendQuery and pass the result to client.get(...).'
			);
		}
		const next = new URLSearchParams();
		const current = pageState.url.searchParams;

		// Preserve non-owned keys (theme, locale, flash, etc.)
		for (const key of new Set(current.keys())) {
			if (ownedKeys.has(key)) continue;
			for (const v of current.getAll(key)) next.append(key, v);
		}

		// page (omit when 0 — the default)
		const pageValue = q.page ?? 0;
		if (pageValue !== 0) next.set('page', String(pageValue));

		// size (omit when equal to DEFAULT_PAGE_SIZE)
		if (q.size !== undefined && q.size !== DEFAULT_PAGE_SIZE) {
			next.set('size', String(q.size));
		}

		// sort (repeat key)
		if (q.sort !== undefined && q.sort.length > 0) {
			for (const entry of q.sort) {
				next.append('sort', `${entry.field},${entry.direction}`);
			}
		}

		// q (omit empty)
		if (q.q !== undefined && q.q !== '') next.set('q', q.q);

		// searchParams
		if (q.searchParams !== undefined) {
			for (const [key, value] of Object.entries(q.searchParams)) {
				if (value === undefined) continue;
				if (Array.isArray(value)) {
					if (value.length === 0) continue;
					for (const v of value) next.append(key, String(v));
				} else {
					next.set(key, String(value));
				}
			}
		}

		return next;
	}

	function createNavigate(options?: { replace?: boolean }) {
		const replace = options?.replace ?? false;
		return (next: Partial<ListQueryWithSearchParams<S>>) => {
			// Auto-reset page to 0 when q or searchParams change without an explicit page.
			const shouldResetPage =
				next.page === undefined && (next.q !== undefined || next.searchParams !== undefined);
			const effective = shouldResetPage ? { ...next, page: 0 } : next;

			const params = toUrlSearchParams(effective);
			const url = new URL(pageState.url);
			url.search = params.toString();
			if (replace) replaceNavigate(url);
			else pushNavigate(url);
		};
	}

	function createDebouncedNavigate(options?: { delay?: number }) {
		const delay = options?.delay ?? 300;
		let timer: ReturnType<typeof setTimeout> | undefined = undefined;
		const navigate = createNavigate({ replace: true });
		return (next: Partial<ListQueryWithSearchParams<S>>) => {
			if (timer !== undefined) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = undefined;
				navigate(next);
			}, delay);
		};
	}

	return {
		searchParams: schema,
		parse,
		toBackendQuery,
		ownedKeys,
		resetOnSubmitKeys,
		toUrlSearchParams,
		createNavigate,
		createDebouncedNavigate
	};
}

// ─────────────────────────────────────────────────────────────────────
// Built-in (lenient + clamp) parsers
// ─────────────────────────────────────────────────────────────────────

function parsePage(raw: string | null): number {
	if (raw === null) return 0;
	const n = Number(raw);
	if (Number.isFinite(n) && Number.isInteger(n) && n >= 0) return n;
	if (import.meta.env.DEV) {
		console.warn(`[list-binding] Invalid \`page\`: "${raw}", falling back to 0.`);
	}
	return 0;
}

function parseSize(raw: string | null): number {
	if (raw === null) return DEFAULT_PAGE_SIZE;
	const n = Number(raw);
	if (!Number.isFinite(n) || !Number.isInteger(n)) {
		if (import.meta.env.DEV) {
			console.warn(
				`[list-binding] Invalid \`size\`: "${raw}", falling back to ${DEFAULT_PAGE_SIZE}.`
			);
		}
		return DEFAULT_PAGE_SIZE;
	}
	if (n < 1) {
		if (import.meta.env.DEV) {
			console.warn(`[list-binding] \`size\` < 1, falling back to ${DEFAULT_PAGE_SIZE}.`);
		}
		return DEFAULT_PAGE_SIZE;
	}
	if (n > MAX_PAGE_SIZE) {
		if (import.meta.env.DEV) {
			console.warn(`[list-binding] \`size\` > ${MAX_PAGE_SIZE}, clamped.`);
		}
		return MAX_PAGE_SIZE;
	}
	return n;
}

function parseSort(rawValues: readonly string[]): SortState[] {
	const out: SortState[] = [];
	for (const raw of rawValues) {
		const entry = parseSortString(raw);
		if (entry === undefined) {
			if (import.meta.env.DEV) {
				console.warn(`[list-binding] Dropped invalid sort entry: "${raw}".`);
			}
			continue;
		}
		out.push(entry);
	}
	return out;
}

function parseQ(raw: string | null): string | undefined {
	if (raw === null || raw === '') return undefined;
	if (raw.length > MAX_Q_LENGTH) {
		if (import.meta.env.DEV) {
			console.warn(`[list-binding] \`q\` truncated to ${MAX_Q_LENGTH} characters.`);
		}
		return raw.slice(0, MAX_Q_LENGTH);
	}
	return raw;
}

// ─────────────────────────────────────────────────────────────────────
// Per-field (strict + drop) parsers
// ─────────────────────────────────────────────────────────────────────

function parseSchema<S extends SearchParamsSchema>(
	schema: S,
	urlParams: URLSearchParams
): SearchParamsShape<S> {
	const result: Record<string, unknown> = {};
	for (const [key, field] of Object.entries(schema)) {
		result[key] = parseField(field, urlParams.getAll(key), urlParams.has(key), key);
	}
	return result as SearchParamsShape<S>;
}

function parseField(
	field: string,
	rawValues: readonly string[],
	hasKey: boolean,
	keyName: string
): unknown {
	switch (field) {
		case 'string':
			return parseStringField(rawValues, hasKey, keyName);
		case 'string[]':
			return parseStringArrayField(rawValues);
		case 'number':
			return parseNumberField(rawValues, hasKey, keyName);
		case 'number[]':
			return parseNumberArrayField(rawValues, keyName);
		case 'boolean':
			return parseBooleanField(rawValues, hasKey, keyName);
		default:
			return undefined;
	}
}

function parseStringField(
	rawValues: readonly string[],
	hasKey: boolean,
	keyName: string
): string | undefined {
	if (!hasKey) return undefined;
	if (rawValues.length > 1 && import.meta.env.DEV) {
		console.warn(
			`[list-binding] \`${keyName}\` is 'string' but URL has multiple values; using the first.`
		);
	}
	const v = rawValues[0];
	if (v === '' || v === undefined) return undefined;
	return v;
}

function parseStringArrayField(rawValues: readonly string[]): readonly string[] {
	return rawValues.filter((v) => v !== '');
}

function parseNumberField(
	rawValues: readonly string[],
	hasKey: boolean,
	keyName: string
): number | undefined {
	if (!hasKey) return undefined;
	const v = rawValues[0];
	if (v === '' || v === undefined) return undefined;
	const n = Number(v);
	if (!Number.isFinite(n)) {
		if (import.meta.env.DEV) {
			console.warn(`[list-binding] \`${keyName}\` is 'number' but got invalid: "${v}".`);
		}
		return undefined;
	}
	return n;
}

function parseNumberArrayField(rawValues: readonly string[], keyName: string): readonly number[] {
	const out: number[] = [];
	for (const v of rawValues) {
		if (v === '') continue;
		const n = Number(v);
		if (!Number.isFinite(n)) {
			if (import.meta.env.DEV) {
				console.warn(`[list-binding] \`${keyName}\` dropped invalid number entry: "${v}".`);
			}
			continue;
		}
		out.push(n);
	}
	return out;
}

function parseBooleanField(
	rawValues: readonly string[],
	hasKey: boolean,
	keyName: string
): boolean | undefined {
	if (!hasKey) return undefined;
	const v = rawValues[0];
	if (v === 'true') return true;
	if (v === 'false') return false;
	if (import.meta.env.DEV) {
		console.warn(
			`[list-binding] \`${keyName}\` boolean strict: only 'true'/'false' accepted, got "${v}".`
		);
	}
	return undefined;
}
