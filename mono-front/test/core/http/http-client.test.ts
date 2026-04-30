import { describe, expect, it, vi } from 'vitest';
import { createHttpClient } from '$lib/core/http/http-client';
import { HttpError, isHttpError } from '$lib/core/http/errors';

type Fetch = typeof globalThis.fetch;

const json = (data: unknown, init: ResponseInit = {}): Response =>
	new Response(JSON.stringify(data), {
		...init,
		headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
	});

const problemJson = (data: unknown, status: number): Response =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/problem+json' }
	});

/** Mocked fetch that listens to the request's signal — required for timeout / external-abort tests. */
const abortAwareFetch = (): Fetch =>
	((input: Request | URL | string): Promise<Response> => {
		const request = input instanceof Request ? input : new Request(input);
		return new Promise<Response>((_, reject) => {
			const onAbort = (): void => reject(request.signal.reason);
			if (request.signal.aborted) {
				onAbort();
			} else {
				request.signal.addEventListener('abort', onAbort);
			}
		});
	}) as Fetch;

const sentRequest = (spy: ReturnType<typeof vi.fn<Fetch>>): Request => {
	const arg = spy.mock.calls[0]?.[0];
	if (!(arg instanceof Request)) throw new Error('expected fetch to receive a Request');
	return arg;
};

describe('createHttpClient — factory', () => {
	it('does not call fetch when the client is created', () => {
		const fetchSpy = vi.fn<Fetch>();
		createHttpClient({ fetch: fetchSpy });
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});

describe('createHttpClient — request building', () => {
	it('GET resolves baseURL + relative path and parses JSON', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ id: 1 })));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		const result = await client.get<{ id: number }>('users/1');
		expect(result).toEqual({ id: 1 });
		const sent = sentRequest(fetchSpy);
		expect(sent.url).toBe('https://api.test/users/1');
		expect(sent.method).toBe('GET');
	});

	it('serializes object body as JSON and sets Content-Type when not already set', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ ok: true })));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		await client.post('users', { name: 'alice' });
		const sent = sentRequest(fetchSpy);
		expect(sent.headers.get('Content-Type')).toBe('application/json');
		await expect(sent.text()).resolves.toBe('{"name":"alice"}');
	});

	it('does not overwrite Content-Type already set by the caller', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ ok: true })));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		await client.post(
			'users',
			{ name: 'alice' },
			{
				headers: { 'Content-Type': 'application/vnd.custom+json' }
			}
		);
		expect(sentRequest(fetchSpy).headers.get('Content-Type')).toBe('application/vnd.custom+json');
	});

	it('merges defaultHeaders with per-request headers, per-request winning', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ ok: true })));
		const client = createHttpClient({
			fetch: fetchSpy,
			baseURL: 'https://api.test/',
			defaultHeaders: { Accept: 'application/json', 'X-Default': '1' }
		});
		await client.get('users', { headers: { Accept: 'text/plain', 'X-Per': '2' } });
		const sent = sentRequest(fetchSpy);
		expect(sent.headers.get('Accept')).toBe('text/plain');
		expect(sent.headers.get('X-Default')).toBe('1');
		expect(sent.headers.get('X-Per')).toBe('2');
	});

	it('appends query parameters', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json([])));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		await client.get('users', { query: { active: true, role: ['admin', 'editor'], cursor: null } });
		const url = new URL(sentRequest(fetchSpy).url);
		expect(url.searchParams.get('active')).toBe('true');
		expect(url.searchParams.getAll('role')).toEqual(['admin', 'editor']);
		expect(url.searchParams.has('cursor')).toBe(false);
	});

	it('attaches a composite signal when external signal and timeout are both provided', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({})));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		const controller = new AbortController();
		await client.get('users', { signal: controller.signal, timeoutMs: 100 });
		expect(sentRequest(fetchSpy).signal).toBeInstanceOf(AbortSignal);
	});
});

describe('createHttpClient — hooks', () => {
	it('runs onRequest hooks in array order (FIFO) and forwards the final Request to fetch', async () => {
		const calls: string[] = [];
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({})));
		const hookA = vi.fn(async (req: Request) => {
			calls.push('A');
			const headers = new Headers(req.headers);
			headers.set('X-Hook', 'A');
			return new Request(req, { headers });
		});
		const hookB = vi.fn(async (req: Request) => {
			calls.push('B');
			const headers = new Headers(req.headers);
			headers.set('X-Hook', `${headers.get('X-Hook') ?? ''}B`);
			return new Request(req, { headers });
		});
		const client = createHttpClient({
			fetch: fetchSpy,
			baseURL: 'https://api.test/',
			hooks: { onRequest: [hookA, hookB] }
		});
		await client.get('users');
		expect(calls).toEqual(['A', 'B']);
		expect(sentRequest(fetchSpy).headers.get('X-Hook')).toBe('AB');
	});

	it('runs onResponse hooks in array order, allowing replacement', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ original: true })));
		const onResponse = vi.fn(async () => json({ replaced: true }));
		const client = createHttpClient({
			fetch: fetchSpy,
			baseURL: 'https://api.test/',
			hooks: { onResponse: [onResponse] }
		});
		const result = await client.get<{ replaced: boolean }>('users');
		expect(result).toEqual({ replaced: true });
	});

	it('propagates an onRequest hook error verbatim and notifies onRequestError', async () => {
		const fetchSpy = vi.fn<Fetch>();
		const hookError = new Error('hook said no');
		const onRequest = vi.fn(async () => {
			throw hookError;
		});
		const onRequestError = vi.fn();
		const client = createHttpClient({
			fetch: fetchSpy,
			baseURL: 'https://api.test/',
			hooks: { onRequest: [onRequest], onRequestError: [onRequestError] }
		});
		await expect(client.get('users')).rejects.toBe(hookError);
		expect(onRequestError).toHaveBeenCalledWith(hookError, expect.any(Request));
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('notifies onResponseError when the response is non-2xx', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(new Response('boom', { status: 500 })));
		const onResponseError = vi.fn();
		const client = createHttpClient({
			fetch: fetchSpy,
			baseURL: 'https://api.test/',
			hooks: { onResponseError: [onResponseError] }
		});
		await expect(client.get('users')).rejects.toMatchObject({ kind: 'http', status: 500 });
		expect(onResponseError).toHaveBeenCalled();
		const [errArg, responseArg, requestArg] = onResponseError.mock.calls[0] ?? [];
		expect(isHttpError(errArg)).toBe(true);
		expect(responseArg).toBeInstanceOf(Response);
		expect(requestArg).toBeInstanceOf(Request);
	});
});

describe('createHttpClient — error mapping', () => {
	it('throws kind: "http" with problem details for application/problem+json', async () => {
		const problem = {
			type: 'about:blank',
			title: 'Forbidden',
			status: 403,
			detail: 'No access'
		};
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(problemJson(problem, 403)));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		try {
			await client.get('users');
			throw new Error('expected throw');
		} catch (e) {
			expect(e).toBeInstanceOf(HttpError);
			const err = e as HttpError;
			expect(err.kind).toBe('http');
			expect(err.status).toBe(403);
			expect(err.problem).toEqual(problem);
		}
	});

	it('throws kind: "network" when fetch rejects with a TypeError', async () => {
		const cause = new TypeError('Failed to fetch');
		const fetchSpy = vi.fn<Fetch>(() => Promise.reject(cause));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		try {
			await client.get('users');
			throw new Error('expected throw');
		} catch (e) {
			expect(e).toBeInstanceOf(HttpError);
			const err = e as HttpError;
			expect(err.kind).toBe('network');
			expect(err.cause).toBe(cause);
		}
	});

	it('throws kind: "parse" when the JSON body is malformed', async () => {
		const fetchSpy = vi.fn<Fetch>(() =>
			Promise.resolve(
				new Response('garbage', { status: 200, headers: { 'Content-Type': 'application/json' } })
			)
		);
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		await expect(client.get('users')).rejects.toMatchObject({ kind: 'parse' });
	});

	it('throws kind: "timeout" when timeoutMs elapses before fetch resolves', async () => {
		const client = createHttpClient({ fetch: abortAwareFetch(), baseURL: 'https://api.test/' });
		try {
			await client.get('users', { timeoutMs: 20 });
			throw new Error('expected throw');
		} catch (e) {
			expect(e).toBeInstanceOf(HttpError);
			const err = e as HttpError;
			expect(err.kind).toBe('timeout');
			expect((err.cause as { name?: string } | null)?.name).toBe('TimeoutError');
		}
	});

	it("does not wrap an external abort — the caller's reason is re-thrown unchanged", async () => {
		const controller = new AbortController();
		const reason = new Error('cancelled by user');
		const client = createHttpClient({ fetch: abortAwareFetch(), baseURL: 'https://api.test/' });
		const promise = client.get('users', { signal: controller.signal });
		// Let the request reach `fetch` before aborting.
		await Promise.resolve();
		await Promise.resolve();
		controller.abort(reason);
		await expect(promise).rejects.toBe(reason);
	});

	it('throws synchronously-detected abort when the signal is already aborted', async () => {
		const controller = new AbortController();
		const reason = new Error('already cancelled');
		controller.abort(reason);
		const fetchSpy = vi.fn<Fetch>();
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		await expect(client.get('users', { signal: controller.signal })).rejects.toBe(reason);
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});

describe('createHttpClient — raw and head', () => {
	it('raw() returns the Response without auto-deserialization', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ data: 1 })));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		const result = await client.raw('users');
		expect(result).toBeInstanceOf(Response);
		expect(result.bodyUsed).toBe(false);
	});

	it('raw() still throws kind: "http" on non-2xx', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(new Response('nope', { status: 500 })));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		await expect(client.raw('users')).rejects.toMatchObject({ kind: 'http', status: 500 });
	});

	it('head() returns the Response without auto-deserialization', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(new Response(null, { status: 200 })));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		const result = await client.head('users');
		expect(result).toBeInstanceOf(Response);
		expect(sentRequest(fetchSpy).method).toBe('HEAD');
	});
});

describe('createHttpClient — concurrency / SSR safety', () => {
	it('keeps state independent across concurrent requests', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({})));
		const observed: string[] = [];
		const onRequest = vi.fn((req: Request) => {
			observed.push(req.url);
			return req;
		});
		const client = createHttpClient({
			fetch: fetchSpy,
			baseURL: 'https://api.test/',
			hooks: { onRequest: [onRequest] }
		});
		await Promise.all([client.get('a'), client.get('b'), client.get('c')]);
		expect(observed.sort()).toEqual([
			'https://api.test/a',
			'https://api.test/b',
			'https://api.test/c'
		]);
	});
});

describe('createHttpClient — empty body handling', () => {
	it('returns undefined for 204 No Content', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(new Response(null, { status: 204 })));
		const client = createHttpClient({ fetch: fetchSpy, baseURL: 'https://api.test/' });
		await expect(client.delete('users/1')).resolves.toBeUndefined();
	});
});
