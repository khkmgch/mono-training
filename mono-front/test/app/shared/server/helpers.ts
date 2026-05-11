import { vi } from 'vitest';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';

type Fetch = typeof globalThis.fetch;

export const buildLocals = (overrides: Partial<App.Locals> = {}): App.Locals => ({
	backend: 'json-server',
	apiBaseURL: 'http://api.test',
	...overrides
});

export const buildCookies = (entries: Record<string, string> = {}) => ({
	get: (name: string) => entries[name],
	getAll: vi.fn(() => Object.entries(entries).map(([name, value]) => ({ name, value }))),
	set: vi.fn(),
	delete: vi.fn(),
	serialize: vi.fn()
});

export const buildServerLoadEvent = (overrides: Partial<ServerLoadEvent> = {}): ServerLoadEvent => {
	const fetchSpy: Fetch = overrides.fetch ?? vi.fn();
	const url = overrides.url ?? new URL('http://test/users');
	const locals = overrides.locals ?? buildLocals();
	const cookies = (overrides.cookies ?? buildCookies()) as ServerLoadEvent['cookies'];
	return {
		fetch: fetchSpy,
		url,
		locals,
		cookies,
		params: overrides.params ?? {},
		request: overrides.request ?? new Request(url),
		route: overrides.route ?? { id: '/users' },
		setHeaders: overrides.setHeaders ?? vi.fn(),
		parent: overrides.parent ?? (async () => ({})),
		depends: overrides.depends ?? vi.fn(),
		untrack: overrides.untrack ?? ((fn) => fn()),
		isDataRequest: overrides.isDataRequest ?? false,
		isSubRequest: overrides.isSubRequest ?? false
	} as unknown as ServerLoadEvent;
};

export const buildRequestEvent = (overrides: Partial<RequestEvent> = {}): RequestEvent => {
	const fetchSpy: Fetch = overrides.fetch ?? vi.fn();
	const url = overrides.url ?? new URL('http://test/users');
	const locals = overrides.locals ?? buildLocals();
	const cookies = (overrides.cookies ?? buildCookies()) as RequestEvent['cookies'];
	return {
		fetch: fetchSpy,
		url,
		locals,
		cookies,
		params: overrides.params ?? {},
		request: overrides.request ?? new Request(url, { method: 'POST' }),
		route: overrides.route ?? { id: '/users' },
		setHeaders: overrides.setHeaders ?? vi.fn(),
		getClientAddress: overrides.getClientAddress ?? (() => '127.0.0.1'),
		platform: overrides.platform,
		isDataRequest: overrides.isDataRequest ?? false,
		isSubRequest: overrides.isSubRequest ?? false
	} as unknown as RequestEvent;
};

export const buildFormDataRequest = (entries: Record<string, string>): Request => {
	const formData = new FormData();
	for (const [key, value] of Object.entries(entries)) formData.set(key, value);
	return new Request('http://test/users', { method: 'POST', body: formData });
};
