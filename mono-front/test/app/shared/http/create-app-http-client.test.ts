import { describe, expect, it, vi } from 'vitest';
import { createAppHttpClient } from '$lib/app/shared/http';

type Fetch = typeof globalThis.fetch;

const json = (data: unknown, init: ResponseInit = {}): Response =>
	new Response(JSON.stringify(data), {
		...init,
		headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
	});

describe('createAppHttpClient', () => {
	it('does not call fetch at construction time', () => {
		const fetchSpy = vi.fn<Fetch>();
		createAppHttpClient({ fetch: fetchSpy });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('uses the provided fetch and baseURL when sending requests', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ id: 1 })));
		const client = createAppHttpClient({ fetch: fetchSpy, baseURL: 'http://api.test/' });
		const result = await client.get<{ id: number }>('users/1');
		expect(result).toEqual({ id: 1 });
		const arg = fetchSpy.mock.calls[0]?.[0];
		expect(arg).toBeInstanceOf(Request);
		expect((arg as Request).url).toBe('http://api.test/users/1');
	});

	it('accepts cookies without breaking (reserved for future BFF auth)', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ ok: true })));
		const client = createAppHttpClient({
			fetch: fetchSpy,
			baseURL: 'http://api.test/',
			cookies: { get: () => 'ignored' }
		});
		await expect(client.get('users')).resolves.toEqual({ ok: true });
	});

	it('applies a default 10-second timeout when timeoutMs is omitted', async () => {
		const fetchSpy = vi.fn<Fetch>((req) => {
			expect(req).toBeInstanceOf(Request);
			expect((req as Request).signal).toBeInstanceOf(AbortSignal);
			return Promise.resolve(json({ ok: true }));
		});
		const client = createAppHttpClient({ fetch: fetchSpy, baseURL: 'http://api.test/' });
		await client.get('users');
		expect(fetchSpy).toHaveBeenCalledOnce();
	});

	it('honors timeoutMs: 0 (disabled)', async () => {
		const fetchSpy = vi.fn<Fetch>(() => Promise.resolve(json({ ok: true })));
		const client = createAppHttpClient({
			fetch: fetchSpy,
			baseURL: 'http://api.test/',
			timeoutMs: 0
		});
		await expect(client.get('users')).resolves.toEqual({ ok: true });
	});
});
