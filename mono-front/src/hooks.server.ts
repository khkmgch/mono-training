import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { readBackend, resolveBaseURL } from '$lib/app/shared/backend';
import { handleUnexpected } from '$lib/app/shared/error';

const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;
		return resolve(event, {
			transformPageChunk: ({ html }) => {
				return html.replace('%lang%', locale).replace('%dir%', getTextDirection(locale));
			}
		});
	});

const backendHandle: Handle = async ({ event, resolve }) => {
	const backend = readBackend(event.cookies);
	event.locals.backend = backend;
	event.locals.apiBaseURL = resolveBaseURL(backend);
	return resolve(event);
};

export const handle: Handle = sequence(paraglideHandle, backendHandle);

export const handleError: HandleServerError = (input) => handleUnexpected(input);
