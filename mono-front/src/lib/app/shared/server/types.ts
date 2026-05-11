import type { ActionFailure, RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { HttpClient } from '$lib/core/http';

/**
 * Per-call HTTP overrides forwarded to {@link createAppHttpClient}. `fetch` and
 * `cookies` are always supplied by the wrapper from the event, so callers
 * cannot override them here.
 */
export type DefineHttpOptions = {
	baseURL?: string | URL;
	timeoutMs?: number;
};

export type ServerLoadContext = {
	event: ServerLoadEvent;
	client: HttpClient;
};

export type ActionContext = {
	event: RequestEvent;
	client: HttpClient;
	/**
	 * `event.request.formData()` resolved by the wrapper. The handler MUST
	 * read form values from this property — calling `event.request.formData()`
	 * again will throw because the body is already consumed.
	 */
	formData: FormData;
	/**
	 * Register the parsed form values so they are reflected back to the form
	 * via `dispatchActionError(err, { values })` on failure. The latest
	 * registered value wins. Calling this is optional; when omitted, failed
	 * submissions surface without input restoration.
	 */
	registerValues: (values: Record<string, unknown>) => void;
};

export type DefineLoadOptions = {
	http?: DefineHttpOptions;
	/**
	 * Replace the default `dispatchLoadError`. Must end the request (return
	 * `never` — typically by throwing `error()` / `redirect()`).
	 */
	onError?: (err: unknown, event: ServerLoadEvent) => never;
};

export type DefineActionsOptions = {
	http?: DefineHttpOptions;
	/**
	 * Replace the default `dispatchActionError`. Return an `ActionFailure`
	 * (Kit `fail()` shape) for inline/banner errors, or throw — typically
	 * `error()` for page-level escalation, or `redirect()` for forced navigation.
	 *
	 * @remarks Throwing is statically invisible in the return type; returning
	 *   `ActionFailure` is the only typed exit. The wrapper invokes this from
	 *   its `catch` block, so any thrown value propagates out unchanged.
	 *
	 * @remarks `ctx.formData` is the FormData instance the wrapper already
	 *   awaited from `event.request`. Use it instead of `event.request.formData()`,
	 *   which would throw because the body is already consumed.
	 */
	onError?: (
		err: unknown,
		ctx: {
			event: RequestEvent;
			formData: FormData;
			values: Record<string, unknown> | undefined;
		}
	) => ActionFailure<Record<string, unknown>> | Promise<ActionFailure<Record<string, unknown>>>;
};

export type LoadHandler<R> = (ctx: ServerLoadContext) => R | Promise<R>;

export type ActionHandler<R = unknown> = (ctx: ActionContext) => R | Promise<R>;
