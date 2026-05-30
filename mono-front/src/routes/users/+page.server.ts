import { routeServer } from '$lib/app/shared/server';

import { userListBinding } from '$lib/app/feature/user/list-binding';
import { fetchUserPage } from '$lib/app/feature/user/api';

import type { PageServerLoad, PageServerLoadEvent } from './$types';

const { defineLoad } = routeServer<PageServerLoadEvent>();

export const load = defineLoad(async ({ event, client }) => {
	const query = userListBinding.parse(event.url);
	const result = await fetchUserPage(
		client,
		userListBinding.toBackendQuery(query),
		event.locals.backend
	);
	return { query, result };
}) satisfies PageServerLoad;
