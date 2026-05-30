import { getString, routeServer } from '$lib/app/shared/server';

import { createUser } from '$lib/app/feature/user/api';

import type { Actions, PageServerLoadEvent, RequestEvent } from './$types';

const { defineActions } = routeServer<PageServerLoadEvent, RequestEvent>();

export const actions = defineActions({
	save: async ({ client, formData, registerValues }) => {
		const loginId = getString(formData, 'loginId');
		const fullName = getString(formData, 'fullName');

		registerValues({ loginId, fullName });

		// Return created so UserForm can PRG-navigate client-side; a server
		// redirect would bypass the toast (dispatchActionSuccess skips redirects).
		const created = await createUser(client, { loginId, fullName });
		return { created };
	}
}) satisfies Actions;
