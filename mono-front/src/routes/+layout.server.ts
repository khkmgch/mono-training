import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	backend: locals.backend,
	apiBaseURL: locals.apiBaseURL
});
