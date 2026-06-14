import { routeServer } from '$lib/app/shared/server';
import { collapseSpaces, stripSpaces } from '$lib/core/text';

import { userListBinding } from '$lib/app/feature/user/list-binding';
import { fetchUserPage } from '$lib/app/feature/user/api';

import type { PageServerLoad, PageServerLoadEvent } from './$types';

const { defineLoad } = routeServer<PageServerLoadEvent>();

export const load = defineLoad(async ({ event, client }) => {
	const parsed = userListBinding.parse(event.url);
	const query = {
		...parsed,
		searchParams: {
			loginId: normalizeSearchTerm(parsed.searchParams.loginId, stripSpaces),
			fullName: normalizeSearchTerm(parsed.searchParams.fullName, collapseSpaces)
		}
	};
	const result = await fetchUserPage(
		client,
		userListBinding.toBackendQuery(query),
		event.locals.backend
	);
	return { query, result };
}) satisfies PageServerLoad;

/** Canonicalize a search term the same way the inputs do, mapping a blank result
 *  to `undefined` so a whitespace-only term drops out of the query instead of
 *  filtering on empty. Guards the URL directly (bookmarks, JS-off, hand-edits). */
function normalizeSearchTerm(
	value: string | undefined,
	normalize: (raw: string) => string
): string | undefined {
	if (value === undefined) return undefined;
	const normalized = normalize(value);
	return normalized === '' ? undefined : normalized;
}
