/**
 * Public type definitions for the `core/http` HTTP client.
 *
 * The runtime entry point is {@link createHttpClient} in `./http-client.ts`.
 */

/** HTTP request method. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Primitive query parameter value. `null` and `undefined` are skipped from the
 * serialized URL — pass them to omit a key without conditional logic at the call site.
 */
export type QueryValue = string | number | boolean | null | undefined;

/**
 * Query parameters. Array values are serialized as repeated keys (`?tag=a&tag=b`).
 *
 * @example
 * ```ts
 * client.get('/users', { query: { active: true, role: ['admin', 'editor'], cursor: null } });
 * // → /users?active=true&role=admin&role=editor   (cursor is skipped)
 * ```
 */
export type Query = Readonly<Record<string, QueryValue | ReadonlyArray<QueryValue>>>;

/**
 * Hook invoked before the request is sent. Return a new `Request` to replace the original;
 * return the input to observe only. Throwing aborts the request and triggers `onRequestError`.
 *
 * @remarks Hooks run in array order (FIFO). Replacing a request loses anything not preserved
 *   in the new `Request` (signal, headers, method, body) — be explicit.
 */
export type HttpRequestHook = (request: Request) => Request | Promise<Request>;

/**
 * Hook invoked after the response is received but before the status check / body parsing.
 * Return a new `Response` to replace the original.
 */
export type HttpResponseHook = (
	response: Response,
	request: Request
) => Response | Promise<Response>;

/**
 * Hook invoked when request-side failures occur (build error / network error / timeout).
 * Observe-only — the original error is always re-thrown.
 */
export type HttpRequestErrorHook = (error: unknown, request: Request) => void | Promise<void>;

/**
 * Hook invoked when response-side failures occur (non-2xx status / body parse failure).
 * Observe-only — the original error is always re-thrown.
 */
export type HttpResponseErrorHook = (
	error: unknown,
	response: Response,
	request: Request
) => void | Promise<void>;

/** Hook configuration registered on the client at construction time. */
export type HttpHooks = Readonly<{
	onRequest?: ReadonlyArray<HttpRequestHook>;
	onResponse?: ReadonlyArray<HttpResponseHook>;
	onRequestError?: ReadonlyArray<HttpRequestErrorHook>;
	onResponseError?: ReadonlyArray<HttpResponseErrorHook>;
}>;

/**
 * Options for {@link createHttpClient}.
 *
 * @remarks `fetch` MUST be the runtime fetch from the consuming environment
 *   (e.g. SvelteKit `LoadEvent.fetch`). Do not import a global fetch — it breaks
 *   credential forwarding and SSR response inlining.
 */
export type HttpClientOptions = Readonly<{
	/** Fetch function. In SvelteKit, pass `LoadEvent.fetch` or `RequestEvent.fetch`. */
	fetch: typeof globalThis.fetch;
	/** Base URL prepended to relative paths via `new URL(path, baseURL)`. */
	baseURL?: string | URL;
	/** Headers merged into every request before per-request headers. */
	defaultHeaders?: HeadersInit;
	/** Default timeout in milliseconds. `0` disables; per-request `timeoutMs` overrides. */
	defaultTimeoutMs?: number;
	hooks?: HttpHooks;
}>;

/**
 * Per-request options.
 *
 * @remarks `signal` is combined with the timeout via `AbortSignal.any` when both are present.
 *   When the abort came from `timeoutMs`, the resulting signal's `reason` is a
 *   `DOMException` with `name === 'TimeoutError'`; an external abort surfaces with the value
 *   passed to the caller's `controller.abort(reason)`.
 */
export type RequestOptions<TBody = unknown> = Readonly<{
	method?: HttpMethod;
	headers?: HeadersInit;
	body?: TBody;
	query?: Query;
	signal?: AbortSignal;
	/** Per-request timeout in milliseconds. `0` disables; falls back to `defaultTimeoutMs`. */
	timeoutMs?: number;
}>;

/**
 * HTTP client returned by {@link createHttpClient}. All methods throw {@link HttpError}
 * on non-2xx responses, network failures, timeouts, and body parse failures.
 */
export type HttpClient = Readonly<{
	/**
	 * Send an arbitrary request. The response body is auto-deserialized based on `Content-Type`
	 * (`application/json` / `application/problem+json` → `json()`,
	 * `application/octet-stream` → `blob()`, otherwise `text()`).
	 * Empty bodies (`Content-Length: 0` or null body) resolve to `undefined`.
	 *
	 * @throws {HttpError}
	 *   - `kind: 'http'` for non-2xx responses
	 *   - `kind: 'network'` for fetch failures
	 *   - `kind: 'timeout'` when `timeoutMs` elapses
	 *   - `kind: 'parse'` when response body cannot be deserialized
	 */
	request<TResponse = unknown>(path: string | URL, options?: RequestOptions): Promise<TResponse>;
	/** Convenience for `request({ method: 'GET' })`. */
	get<TResponse = unknown>(
		path: string | URL,
		options?: Omit<RequestOptions, 'method' | 'body'>
	): Promise<TResponse>;
	/** Convenience for `request({ method: 'POST', body })`. */
	post<TResponse = unknown, TBody = unknown>(
		path: string | URL,
		body?: TBody,
		options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
	): Promise<TResponse>;
	put<TResponse = unknown, TBody = unknown>(
		path: string | URL,
		body?: TBody,
		options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
	): Promise<TResponse>;
	patch<TResponse = unknown, TBody = unknown>(
		path: string | URL,
		body?: TBody,
		options?: Omit<RequestOptions<TBody>, 'method' | 'body'>
	): Promise<TResponse>;
	delete<TResponse = unknown>(
		path: string | URL,
		options?: Omit<RequestOptions, 'method' | 'body'>
	): Promise<TResponse>;
	/** HEAD without auto-deserialization. Returns the raw `Response`. */
	head(path: string | URL, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<Response>;
	/** Send a request and return the raw `Response` without auto-deserialization. Still throws on non-2xx. */
	raw(path: string | URL, options?: RequestOptions): Promise<Response>;
}>;
