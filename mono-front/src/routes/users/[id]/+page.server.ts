import { getNumber, getString, routeServer } from '$lib/app/shared/server';

import { deleteUser, fetchUser, updateUser } from '$lib/app/feature/user/api';

import type { Actions, PageServerLoad, PageServerLoadEvent, RequestEvent } from './$types';

const { defineLoad, defineActions } = routeServer<PageServerLoadEvent, RequestEvent>();

export const load = defineLoad(async ({ event, client }) => {
	const user = await fetchUser(client, event.params.id);
	return { user };
}) satisfies PageServerLoad;

export const actions = defineActions({
	save: async ({ client, formData, registerValues, event }) => {
		const loginId = getString(formData, 'loginId');
		const fullName = getString(formData, 'fullName');
		const version = getNumber(formData, 'version');

		registerValues({ loginId, fullName });

		await updateUser(client, event.params.id, { loginId, fullName, version });
	},
	delete: async ({ client, formData, event }) => {
		const version = getNumber(formData, 'version');
		await deleteUser(client, event.params.id, version);
	}
}) satisfies Actions;
