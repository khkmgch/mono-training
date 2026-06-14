import { getNumber, getString, routeServer } from '$lib/app/shared/server';
import { collapseSpaces, stripSpaces } from '$lib/core/text';

import { deleteUser, fetchUser, updateUser } from '$lib/app/feature/user/api';
import type { UserFormValues } from '$lib/app/feature/user/types';

import type { Actions, PageServerLoad, PageServerLoadEvent, RequestEvent } from './$types';

const { defineLoad, defineActions } = routeServer<PageServerLoadEvent, RequestEvent>();

export const load = defineLoad(async ({ event, client }) => {
	const user = await fetchUser(client, event.params.id);
	return { user };
}) satisfies PageServerLoad;

export const actions = defineActions({
	save: async ({ client, formData, registerValues, event }) => {
		const values: UserFormValues = {
			loginId: stripSpaces(getString(formData, 'loginId')),
			fullName: collapseSpaces(getString(formData, 'fullName'))
		};
		const version = getNumber(formData, 'version');

		registerValues(values);

		await updateUser(client, event.params.id, { ...values, version });
	},
	delete: async ({ client, formData, event }) => {
		const version = getNumber(formData, 'version');
		await deleteUser(client, event.params.id, version);
	}
}) satisfies Actions;
