import { DEFAULT_PAGE_SIZE, type PageResult } from '$lib/core/list';
import type { HttpClient, Query } from '$lib/core/http';

import { remapBuiltinKeysForJsonServer } from './json-server-keys';
import type { JsonServerListResponse } from './types';

/**
 * Fetch a json-server v1 list endpoint and normalize it into the core
 * {@link PageResult} shape. The returned `page` echoes the requested page (not
 * the server's), so a request past the last page stays detectable as out of range.
 */
export async function jsonServerList<T>(
	client: HttpClient,
	path: string,
	query: Query,
	options?: { filterRemap?: (q: Query) => Query }
): Promise<PageResult<T>> {
	const builtinRemapped = remapBuiltinKeysForJsonServer(query);
	const final = options?.filterRemap ? options.filterRemap(builtinRemapped) : builtinRemapped;

	const body = await client.get<JsonServerListResponse<T>>(path, { query: final });

	const requestedPage = typeof query.page === 'number' ? query.page : 0;
	const size = typeof query.size === 'number' ? query.size : DEFAULT_PAGE_SIZE;

	return {
		items: body.data,
		page: requestedPage,
		size,
		totalCount: body.items,
		totalPages: body.pages
	};
}
