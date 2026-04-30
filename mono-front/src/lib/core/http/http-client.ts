import { HttpError } from './errors';
import { mergeHeaders } from './headers';
import { appendQuery } from './query';
import { resolveUrl } from './request';
import { ensureOk, processResponse } from './response';
import { combineSignals, isTimeoutAbort } from './signal';
import { serializeBody } from './body';
import type {
	HttpClient,
	HttpClientOptions,
	HttpRequestErrorHook,
	HttpRequestHook,
	HttpResponseErrorHook,
	HttpResponseHook,
	RequestOptions
} from './types';

const NO_REQUEST_HOOKS: ReadonlyArray<HttpRequestHook> = [];
const NO_RESPONSE_HOOKS: ReadonlyArray<HttpResponseHook> = [];
const NO_REQUEST_ERROR_HOOKS: ReadonlyArray<HttpRequestErrorHook> = [];
const NO_RESPONSE_ERROR_HOOKS: ReadonlyArray<HttpResponseErrorHook> = [];

/**
 * Create an HTTP client bound to a specific `fetch` implementation.
 *
 * @remarks
 * - **Do not call this at module top-level.** State is captured in the closure;
 *   creating a client at module top would share that state across SSR requests.
 *   Always create the client inside a per-request scope (e.g. SvelteKit `load`).
 * - The factory itself has no side effects: it does not call `fetch` or schedule timers.
 * - Hooks run in array order. Returning a new `Request` / `Response` from `onRequest` /
 *   `onResponse` replaces the original — be sure to copy across the fields you need.
 * - External `AbortController.abort` surfaces as the caller's `reason` unchanged
 *   (no `HttpError` wrap), since an external abort is the caller's deliberate signal.
 *
 * @example
 * ```ts
 * // src/routes/+page.ts
 * import { createHttpClient } from '$lib/core';
 *
 * export const load = async ({ fetch }) => {
 *   const client = createHttpClient({ fetch, baseURL: '/api' });
 *   return { user: await client.get<User>('/users/1') };
 * };
 * ```
 */
export function createHttpClient(options: HttpClientOptions): HttpClient {
	const requestHooks = options.hooks?.onRequest ?? NO_REQUEST_HOOKS;
	const responseHooks = options.hooks?.onResponse ?? NO_RESPONSE_HOOKS;
	const requestErrorHooks = options.hooks?.onRequestError ?? NO_REQUEST_ERROR_HOOKS;
	const responseErrorHooks = options.hooks?.onResponseError ?? NO_RESPONSE_ERROR_HOOKS;

	function buildRequest(path: string | URL, opts: RequestOptions): Request {
		const url = appendQuery(resolveUrl(path, options.baseURL), opts.query);
		const headers = mergeHeaders(options.defaultHeaders, opts.headers);
		const { body, contentType } = serializeBody(opts.body);
		if (contentType !== undefined && !headers.has('Content-Type')) {
			headers.set('Content-Type', contentType);
		}
		const signal = combineSignals(opts.signal, opts.timeoutMs ?? options.defaultTimeoutMs);
		const init: RequestInit = {
			method: opts.method ?? 'GET',
			headers
		};
		if (body !== null) init.body = body;
		if (signal !== undefined) init.signal = signal;
		return new Request(url, init);
	}

	function makeFallbackRequest(path: string | URL): Request {
		try {
			return new Request(typeof path === 'string' ? path : path.toString());
		} catch {
			return new Request('about:blank');
		}
	}

	async function runRequestHooks(initial: Request): Promise<Request> {
		let current = initial;
		for (const hook of requestHooks) {
			current = await hook(current);
		}
		return current;
	}

	async function runResponseHooks(initial: Response, request: Request): Promise<Response> {
		let current = initial;
		for (const hook of responseHooks) {
			current = await hook(current, request);
		}
		return current;
	}

	async function notifyRequestError(error: unknown, request: Request): Promise<void> {
		for (const hook of requestErrorHooks) {
			await hook(error, request);
		}
	}

	async function notifyResponseError(
		error: unknown,
		response: Response,
		request: Request
	): Promise<void> {
		for (const hook of responseErrorHooks) {
			await hook(error, response, request);
		}
	}

	function mapAbortedSignalToError(request: Request, opts: RequestOptions): unknown {
		if (isTimeoutAbort(request.signal)) {
			const ms = opts.timeoutMs ?? options.defaultTimeoutMs;
			return new HttpError({
				kind: 'timeout',
				message: ms !== undefined ? `Request timed out after ${ms}ms` : 'Request timed out',
				request,
				cause: request.signal.reason
			});
		}
		return request.signal.reason;
	}

	function mapFetchErrorToError(request: Request, opts: RequestOptions, cause: unknown): unknown {
		if (request.signal.aborted) {
			return mapAbortedSignalToError(request, opts);
		}
		return new HttpError({
			kind: 'network',
			message: cause instanceof Error ? cause.message : 'Network request failed',
			request,
			cause
		});
	}

	async function send(
		path: string | URL,
		opts: RequestOptions,
		returnRaw: boolean
	): Promise<unknown> {
		// 1) Build the request. Failures here (e.g. malformed URL) become kind: 'network'.
		let request: Request;
		try {
			request = buildRequest(path, opts);
		} catch (cause) {
			const fallback = makeFallbackRequest(path);
			const err = new HttpError({
				kind: 'network',
				message: cause instanceof Error ? cause.message : 'Failed to build request',
				request: fallback,
				cause
			});
			await notifyRequestError(err, fallback);
			throw err;
		}

		// 2) If the signal is already aborted, surface that without calling fetch.
		if (request.signal.aborted) {
			const err = mapAbortedSignalToError(request, opts);
			await notifyRequestError(err, request);
			throw err;
		}

		// 3) Run onRequest hooks. Hook-thrown errors propagate as-is (not wrapped).
		let finalRequest: Request;
		try {
			finalRequest = await runRequestHooks(request);
		} catch (cause) {
			await notifyRequestError(cause, request);
			throw cause;
		}

		// 4) Dispatch.
		let response: Response;
		try {
			response = await options.fetch(finalRequest);
		} catch (cause) {
			const err = mapFetchErrorToError(finalRequest, opts, cause);
			await notifyRequestError(err, finalRequest);
			throw err;
		}

		// 5) Run onResponse hooks. Hook-thrown errors propagate as-is.
		let finalResponse: Response;
		try {
			finalResponse = await runResponseHooks(response, finalRequest);
		} catch (cause) {
			await notifyResponseError(cause, response, finalRequest);
			throw cause;
		}

		// 6) Status check + (optional) body deserialization.
		try {
			if (returnRaw) {
				await ensureOk(finalResponse, finalRequest);
				return finalResponse;
			}
			return await processResponse(finalResponse, finalRequest);
		} catch (err) {
			await notifyResponseError(err, finalResponse, finalRequest);
			throw err;
		}
	}

	const client: HttpClient = Object.freeze({
		request<T>(path: string | URL, opts: RequestOptions = {}): Promise<T> {
			return send(path, opts, false) as Promise<T>;
		},
		get<T>(path: string | URL, opts: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
			return send(path, { ...opts, method: 'GET' }, false) as Promise<T>;
		},
		post<T, B = unknown>(
			path: string | URL,
			body?: B,
			opts: Omit<RequestOptions<B>, 'method' | 'body'> = {}
		): Promise<T> {
			return send(path, { ...opts, method: 'POST', body }, false) as Promise<T>;
		},
		put<T, B = unknown>(
			path: string | URL,
			body?: B,
			opts: Omit<RequestOptions<B>, 'method' | 'body'> = {}
		): Promise<T> {
			return send(path, { ...opts, method: 'PUT', body }, false) as Promise<T>;
		},
		patch<T, B = unknown>(
			path: string | URL,
			body?: B,
			opts: Omit<RequestOptions<B>, 'method' | 'body'> = {}
		): Promise<T> {
			return send(path, { ...opts, method: 'PATCH', body }, false) as Promise<T>;
		},
		delete<T>(path: string | URL, opts: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
			return send(path, { ...opts, method: 'DELETE' }, false) as Promise<T>;
		},
		head(
			path: string | URL,
			opts: Omit<RequestOptions, 'method' | 'body'> = {}
		): Promise<Response> {
			return send(path, { ...opts, method: 'HEAD' }, true) as Promise<Response>;
		},
		raw(path: string | URL, opts: RequestOptions = {}): Promise<Response> {
			return send(path, opts, true) as Promise<Response>;
		}
	});

	return client;
}
