import { getString, routeServer } from '$lib/app/shared/server';
import { collapseSpaces, stripSpaces } from '$lib/core/text';

import { createUser } from '$lib/app/feature/user/api';
import type { UserFormValues } from '$lib/app/feature/user/types';

import type { Actions, PageServerLoadEvent, RequestEvent } from './$types';

const { defineActions } = routeServer<PageServerLoadEvent, RequestEvent>();

export const actions = defineActions({
	save: async ({ client, formData, registerValues }) => {
		const values: UserFormValues = {
			loginId: stripSpaces(getString(formData, 'loginId')),
			fullName: collapseSpaces(getString(formData, 'fullName'))
		};

		registerValues(values);

		// Return created so UserForm can PRG-navigate client-side; a server
		// redirect would bypass the toast (dispatchActionSuccess skips redirects).
		const created = await createUser(client, values);
		return { created };
	}
}) satisfies Actions;
