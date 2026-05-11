import { HttpError, type HttpErrorKind, type ProblemDetails } from '$lib/core/http';

type BuildArgs = {
	kind?: HttpErrorKind;
	status?: number;
	message?: string;
	url?: string;
	method?: string;
	problem?: ProblemDetails;
	responseHeaders?: Record<string, string>;
	cause?: unknown;
};

/** Construct an HttpError instance for use in tests. */
export const buildHttpError = (args: BuildArgs = {}): HttpError => {
	const request = new Request(args.url ?? 'http://api.test/resource', {
		method: args.method ?? 'GET'
	});
	const response =
		args.responseHeaders !== undefined || args.kind === 'http' || args.kind === 'parse'
			? new Response(null, {
					status: args.status ?? 500,
					headers: args.responseHeaders ?? {}
				})
			: undefined;
	return new HttpError({
		kind: args.kind ?? 'http',
		message: args.message ?? 'failure',
		request,
		response,
		status: args.status,
		problem: args.problem,
		cause: args.cause
	});
};
