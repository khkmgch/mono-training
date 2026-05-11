import type { HandleClientError } from '@sveltejs/kit';
import { handleUnexpected } from '$lib/app/shared/error';

export const handleError: HandleClientError = (input) => handleUnexpected(input);
