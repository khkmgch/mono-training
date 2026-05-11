import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { error as kitError, redirect as kitRedirect, type ServerLoadEvent } from '@sveltejs/kit';
import { HttpError } from '$lib/core/http';
import { defineLoad } from '$lib/app/shared/server';
import { buildCookies, buildServerLoadEvent } from './helpers';

const dispatchLoadErrorSpy = vi.fn();
vi.mock('$lib/app/shared/error', async () => {
	const actual =
		await vi.importActual<typeof import('$lib/app/shared/error')>('$lib/app/shared/error');
	return {
		...actual,
		dispatchLoadError: (err: unknown) => {
			dispatchLoadErrorSpy(err);
			throw kitError(500, { message: 'dispatched' });
		}
	};
});

const createAppHttpClientSpy = vi.fn();
vi.mock('$lib/app/shared/http', async () => {
	const actual =
		await vi.importActual<typeof import('$lib/app/shared/http')>('$lib/app/shared/http');
	return {
		...actual,
		createAppHttpClient: (input: Parameters<typeof actual.createAppHttpClient>[0]) => {
			createAppHttpClientSpy(input);
			return actual.createAppHttpClient(input);
		}
	};
});

const captureThrow = (fn: () => unknown | Promise<unknown>): Promise<unknown> =>
	Promise.resolve(fn()).then(
		(value) => {
			throw new Error(`expected to throw, got ${String(value)}`);
		},
		(err) => err
	);

describe('defineLoad', () => {
	beforeEach(() => {
		dispatchLoadErrorSpy.mockClear();
		createAppHttpClientSpy.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('returns the handler result and provides client + event in context', async () => {
		const load = defineLoad(({ event, client }) => ({
			marker: 'ok' as const,
			path: event.url.pathname,
			hasClient: typeof client.get === 'function'
		}));
		const event = buildServerLoadEvent({ url: new URL('http://test/x') });
		const result = await load(event);
		expect(result).toEqual({ marker: 'ok', path: '/x', hasClient: true });
	});

	it('builds the http client from event fetch / locals.apiBaseURL / cookies', async () => {
		const fetchSpy = vi.fn();
		const cookies = buildCookies({ session: 's' });
		const load = defineLoad(() => ({}));
		await load(
			buildServerLoadEvent({
				fetch: fetchSpy as never,
				cookies: cookies as never,
				locals: { backend: 'quarkus', apiBaseURL: 'http://api.example/' }
			})
		);
		expect(createAppHttpClientSpy).toHaveBeenCalledOnce();
		const arg = createAppHttpClientSpy.mock.calls[0]?.[0];
		expect(arg.fetch).toBe(fetchSpy);
		expect(arg.baseURL).toBe('http://api.example/');
		expect(arg.cookies).toBe(cookies);
	});

	it('options.http overrides baseURL and timeoutMs', async () => {
		const load = defineLoad(
			{ http: { baseURL: 'http://override.test', timeoutMs: 30_000 } },
			() => ({})
		);
		await load(buildServerLoadEvent());
		const arg = createAppHttpClientSpy.mock.calls[0]?.[0];
		expect(arg.baseURL).toBe('http://override.test');
		expect(arg.timeoutMs).toBe(30_000);
	});

	it('routes thrown HttpError through dispatchLoadError', async () => {
		const httpErr = new HttpError({
			kind: 'http',
			message: '404',
			request: new Request('http://test/x'),
			status: 404
		});
		const load = defineLoad(() => {
			throw httpErr;
		});
		const event = buildServerLoadEvent();
		await captureThrow(() => load(event));
		expect(dispatchLoadErrorSpy).toHaveBeenCalledOnce();
		expect(dispatchLoadErrorSpy.mock.calls[0]?.[0]).toBe(httpErr);
	});

	it('passes SvelteKit error() through without invoking dispatchLoadError', async () => {
		const load = defineLoad(() => {
			throw kitError(404, { message: 'gone' });
		});
		const thrown = (await captureThrow(() => load(buildServerLoadEvent()))) as {
			status: number;
		};
		expect(thrown.status).toBe(404);
		expect(dispatchLoadErrorSpy).not.toHaveBeenCalled();
	});

	it('passes SvelteKit redirect() through without invoking dispatchLoadError', async () => {
		const load = defineLoad(() => {
			throw kitRedirect(303, '/x');
		});
		const thrown = (await captureThrow(() => load(buildServerLoadEvent()))) as {
			status: number;
			location: string;
		};
		expect(thrown.status).toBe(303);
		expect(thrown.location).toBe('/x');
		expect(dispatchLoadErrorSpy).not.toHaveBeenCalled();
	});

	it('uses options.onError when provided and skips dispatchLoadError', async () => {
		const customError = vi.fn<(err: unknown, event: ServerLoadEvent) => never>(() => {
			throw kitRedirect(303, '/login');
		});
		const httpErr = new HttpError({
			kind: 'http',
			message: '401',
			request: new Request('http://test'),
			status: 401
		});
		const load = defineLoad({ onError: customError }, () => {
			throw httpErr;
		});
		const thrown = (await captureThrow(() => load(buildServerLoadEvent()))) as {
			status: number;
		};
		expect(customError).toHaveBeenCalledOnce();
		expect(thrown.status).toBe(303);
		expect(dispatchLoadErrorSpy).not.toHaveBeenCalled();
	});

	it('rethrows non-HttpError values via dispatchLoadError as well (re-thrown internally)', async () => {
		const load = defineLoad(() => {
			throw new Error('boom');
		});
		await captureThrow(() => load(buildServerLoadEvent()));
		// dispatchLoadError will re-throw non-HttpError; we still pass the value through it
		expect(dispatchLoadErrorSpy).toHaveBeenCalledOnce();
	});
});
