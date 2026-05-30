import type { HttpClient, Query } from '$lib/core/http';
import type { PageResult } from '$lib/core/list';
import type { BackendTarget } from '$lib/app/shared/backend';
import { jsonServerList } from '$lib/app/shared/backend';

import type { UpsertUserRequest, User } from './types';

export async function fetchUserPage(
	client: HttpClient,
	query: Query,
	backend: BackendTarget
): Promise<PageResult<User>> {
	if (backend === 'quarkus') {
		return client.get<PageResult<User>>('/users', { query });
	}
	return jsonServerList<User>(client, '/users', query, {
		filterRemap: remapUserFilters
	});
}

export function fetchUser(client: HttpClient, id: string): Promise<User> {
	return client.get<User>(`/users/${id}`);
}

export function createUser(client: HttpClient, body: UpsertUserRequest): Promise<User> {
	return client.post<User, UpsertUserRequest>('/users', body);
}

export function updateUser(
	client: HttpClient,
	id: string,
	body: UpsertUserRequest & { version: number }
): Promise<User> {
	return client.patch<User, typeof body>(`/users/${id}`, body);
}

export async function deleteUser(client: HttpClient, id: string, version: number): Promise<void> {
	await client.delete(`/users/${id}`, { query: { version } });
}

// json-server v1 requires `:contains` suffix; v0 `_like` silently returns the full collection.
export function remapUserFilters(query: Query): Query {
	const out: Record<string, unknown> = { ...query };
	if ('loginId' in out) {
		out['loginId:contains'] = out.loginId;
		delete out.loginId;
	}
	if ('fullName' in out) {
		out['fullName:contains'] = out.fullName;
		delete out.fullName;
	}
	return out as Query;
}
