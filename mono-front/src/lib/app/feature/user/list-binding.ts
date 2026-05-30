import { createListBinding } from '$lib/app/shared/ui/list';

// Module-level so debounce timer survives across navigations.
export const userListBinding = createListBinding({
	searchParams: {
		loginId: 'string',
		fullName: 'string'
	}
});
