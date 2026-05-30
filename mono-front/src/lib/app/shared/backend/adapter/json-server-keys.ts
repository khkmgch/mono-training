import type { Query } from '$lib/core/http';

/**
 * Remap the list builtins (`page` / `size` / `sort`) to json-server v1 query
 * keys. json-server quirks: `_page` is 1-based and descending sort is encoded
 * as a `-` prefix. Feature filters are remapped separately via `jsonServerList`.
 */
export function remapBuiltinKeysForJsonServer(query: Query): Query {
	const out: Record<string, unknown> = { ...query };

	if (typeof out.page === 'number') {
		out._page = out.page + 1;
		delete out.page;
	}

	if (typeof out.size === 'number') {
		out._per_page = out.size;
		delete out.size;
	}

	if (Array.isArray(out.sort)) {
		const parts = (out.sort as readonly string[]).map((entry) => {
			const [field, direction] = entry.split(',');
			return direction === 'desc' ? `-${field}` : field;
		});
		if (parts.length > 0) out._sort = parts.join(',');
		delete out.sort;
	}

	return out as Query;
}
