import { createHttpClient, type HttpClient } from '$lib/core/http';

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Build a {@link HttpClient} bound to a SvelteKit `LoadEvent.fetch` /
 * `RequestEvent.fetch`, with project-level defaults.
 *
 * @remarks
 * - **Do not call at module top-level.** State is captured in the closure and
 *   would be shared across SSR requests.
 * - `event.fetch` MUST be passed so SvelteKit's SSR/hydration optimizations
 *   (cookie inheritance, internal `+server.js` direct calls, SSR response
 *   inlining) keep working.
 * - `cookies` is reserved for the future JWT-BFF authentication flow: a
 *   server-only cookie store will be read here to construct an
 *   `Authorization: Bearer ...` header. Until then it is accepted but unused —
 *   keeping the signature stable means callers do not have to change when the
 *   auth feature lands.
 *
 * @example
 * ```ts
 * export const load = async ({ fetch, locals }) => {
 *   const client = createAppHttpClient({ fetch, baseURL: locals.apiBaseURL });
 *   return { users: await client.get<User[]>('/users') };
 * };
 * ```
 */
export function createAppHttpClient(input: {
	fetch: typeof fetch;
	baseURL?: string | URL;
	/**
	 * Reserved for future JWT-BFF auth. The shape matches SvelteKit
	 * `RequestEvent.cookies.get`. Currently accepted but unused — keeping the
	 * parameter in the signature today means call sites do not have to change
	 * when authentication lands.
	 */
	cookies?: { get(name: string): string | undefined };
	/** Default timeout in ms. `0` disables. Per-request `RequestOptions.timeoutMs` overrides. */
	timeoutMs?: number;
}): HttpClient {
	return createHttpClient({
		fetch: input.fetch,
		baseURL: input.baseURL,
		defaultTimeoutMs: input.timeoutMs ?? DEFAULT_TIMEOUT_MS
	});
}
