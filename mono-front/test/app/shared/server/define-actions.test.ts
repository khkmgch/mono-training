import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	error as kitError,
	fail as kitFail,
	redirect as kitRedirect,
	type ActionFailure,
	type RequestEvent
} from '@sveltejs/kit';
import { HttpError } from '$lib/core/http';
import { defineActions } from '$lib/app/shared/server';
import { buildFormDataRequest, buildRequestEvent } from './helpers';

type OnErrorFn = (
	err: unknown,
	ctx: {
		event: RequestEvent;
		formData: FormData;
		values: Record<string, unknown> | undefined;
	}
) => ActionFailure<Record<string, unknown>>;

const dispatchActionErrorSpy = vi.fn();
vi.mock('$lib/app/shared/error', async () => {
	const actual =
		await vi.importActual<typeof import('$lib/app/shared/error')>('$lib/app/shared/error');
	return {
		...actual,
		dispatchActionError: <T extends Record<string, unknown>>(err: unknown, ctx: { values?: T }) => {
			dispatchActionErrorSpy(err, ctx);
			return kitFail(400, { ...(ctx.values ?? {}), error: { message: 'dispatched' } } as T & {
				error: App.Error;
			});
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

describe('defineActions', () => {
	beforeEach(() => {
		dispatchActionErrorSpy.mockClear();
		createAppHttpClientSpy.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('forwards client / formData / event to handler and returns its result', async () => {
		const handler = vi.fn(({ formData, client, event }) => ({
			ok: true,
			name: formData.get('name'),
			hasClient: typeof client.get === 'function',
			path: event.url.pathname
		}));
		const actions = defineActions({ default: handler });
		const event = buildRequestEvent({
			request: buildFormDataRequest({ name: 'taro' }),
			url: new URL('http://test/users/new')
		});
		const result = await actions.default!(event);
		expect(result).toEqual({ ok: true, name: 'taro', hasClient: true, path: '/users/new' });
	});

	it('builds independent handlers for each named action', async () => {
		const save = vi.fn(() => ({ saved: true }));
		const remove = vi.fn(() => ({ removed: true }));
		const actions = defineActions({ save, delete: remove });
		await actions.save!(buildRequestEvent({ request: buildFormDataRequest({}) }));
		await actions.delete!(buildRequestEvent({ request: buildFormDataRequest({}) }));
		expect(save).toHaveBeenCalledOnce();
		expect(remove).toHaveBeenCalledOnce();
	});

	it('passes registered values to dispatchActionError on HttpError', async () => {
		const httpErr = new HttpError({
			kind: 'http',
			message: '422',
			request: new Request('http://test'),
			status: 422
		});
		const actions = defineActions({
			default: ({ formData, registerValues }) => {
				const values = { name: String(formData.get('name') ?? '') };
				registerValues(values);
				throw httpErr;
			}
		});
		const event = buildRequestEvent({ request: buildFormDataRequest({ name: 'taro' }) });
		const result = (await actions.default!(event)) as unknown as { data: { name: string } };
		expect(dispatchActionErrorSpy).toHaveBeenCalledOnce();
		expect(dispatchActionErrorSpy.mock.calls[0]?.[1].values).toEqual({ name: 'taro' });
		expect(result.data.name).toBe('taro');
	});

	it('passes empty values when registerValues is not called', async () => {
		const httpErr = new HttpError({
			kind: 'http',
			message: '500',
			request: new Request('http://test'),
			status: 500
		});
		const actions = defineActions({
			default: () => {
				throw httpErr;
			}
		});
		await actions.default!(buildRequestEvent({ request: buildFormDataRequest({}) }));
		expect(dispatchActionErrorSpy.mock.calls[0]?.[1].values).toEqual({});
	});

	it('options.http overrides baseURL and timeoutMs for every action', async () => {
		const actions = defineActions(
			{ http: { baseURL: 'http://override.test', timeoutMs: 5_000 } },
			{ default: () => ({}) }
		);
		await actions.default!(buildRequestEvent({ request: buildFormDataRequest({}) }));
		const arg = createAppHttpClientSpy.mock.calls[0]?.[0];
		expect(arg.baseURL).toBe('http://override.test');
		expect(arg.timeoutMs).toBe(5_000);
	});

	it('passes SvelteKit redirect() through untouched', async () => {
		const actions = defineActions({
			default: () => {
				throw kitRedirect(303, '/users/1');
			}
		});
		const thrown = (await captureThrow(() =>
			actions.default!(buildRequestEvent({ request: buildFormDataRequest({}) }))
		)) as { status: number; location: string };
		expect(thrown.status).toBe(303);
		expect(thrown.location).toBe('/users/1');
		expect(dispatchActionErrorSpy).not.toHaveBeenCalled();
	});

	it('passes SvelteKit error() through untouched', async () => {
		const actions = defineActions({
			default: () => {
				throw kitError(403, { message: 'forbidden' });
			}
		});
		const thrown = (await captureThrow(() =>
			actions.default!(buildRequestEvent({ request: buildFormDataRequest({}) }))
		)) as { status: number };
		expect(thrown.status).toBe(403);
		expect(dispatchActionErrorSpy).not.toHaveBeenCalled();
	});

	it('uses options.onError when provided and skips dispatchActionError', async () => {
		const customError = vi.fn<OnErrorFn>(() => kitFail(409, { error: { message: 'custom' } }));
		const httpErr = new HttpError({
			kind: 'http',
			message: '422',
			request: new Request('http://test'),
			status: 422
		});
		const actions = defineActions(
			{ onError: customError },
			{
				default: ({ registerValues }) => {
					registerValues({ name: 'taro' });
					throw httpErr;
				}
			}
		);
		const result = (await actions.default!(
			buildRequestEvent({ request: buildFormDataRequest({}) })
		)) as { status: number };
		expect(customError).toHaveBeenCalledOnce();
		expect(customError.mock.calls[0]?.[1]?.values).toEqual({ name: 'taro' });
		expect(result.status).toBe(409);
		expect(dispatchActionErrorSpy).not.toHaveBeenCalled();
	});

	it('passes the consumed FormData to options.onError so handlers do not re-read the body', async () => {
		const customError = vi.fn<OnErrorFn>(() => kitFail(400, { error: { message: 'custom' } }));
		const httpErr = new HttpError({
			kind: 'http',
			message: '400',
			request: new Request('http://test'),
			status: 400
		});
		const actions = defineActions(
			{ onError: customError },
			{
				default: () => {
					throw httpErr;
				}
			}
		);
		await actions.default!(buildRequestEvent({ request: buildFormDataRequest({ name: 'taro' }) }));
		const ctx = customError.mock.calls[0]?.[1];
		expect(ctx?.formData?.get('name')).toBe('taro');
		expect(typeof ctx?.formData?.entries).toBe('function');
	});
});
