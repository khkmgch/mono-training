/**
 * json-server v1 list response. Watch the misleading field names: `items` is the
 * total count and `data` is the page payload (`jsonServerList` normalizes both
 * to the core `PageResult` shape).
 */
export type JsonServerListResponse<T> = {
	first: number;
	prev: number | null;
	next: number | null;
	last: number;
	pages: number;
	items: number;
	data: T[];
};
