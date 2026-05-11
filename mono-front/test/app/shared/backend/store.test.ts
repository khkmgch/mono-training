import { describe, expect, it } from 'vitest';
import {
	BACKEND_BASE_URLS,
	BACKEND_COOKIE,
	readBackend,
	resolveBaseURL
} from '$lib/app/shared/backend';

const cookies = (
	entries: Record<string, string | undefined>
): { get(name: string): string | undefined } => ({
	get: (name) => entries[name]
});

describe('readBackend', () => {
	it('returns the cookie value when it matches a known target', () => {
		expect(readBackend(cookies({ [BACKEND_COOKIE]: 'json-server' }))).toBe('json-server');
		expect(readBackend(cookies({ [BACKEND_COOKIE]: 'quarkus' }))).toBe('quarkus');
	});

	it('falls back to json-server when the cookie is unset', () => {
		expect(readBackend(cookies({}))).toBe('json-server');
	});

	it('falls back to json-server when the cookie holds an unknown value', () => {
		expect(readBackend(cookies({ [BACKEND_COOKIE]: 'mysql' }))).toBe('json-server');
		expect(readBackend(cookies({ [BACKEND_COOKIE]: '' }))).toBe('json-server');
	});
});

describe('resolveBaseURL', () => {
	it('returns the configured URL for each known target', () => {
		expect(resolveBaseURL('json-server')).toBe(BACKEND_BASE_URLS['json-server']);
		expect(resolveBaseURL('quarkus')).toBe(BACKEND_BASE_URLS.quarkus);
	});

	it('exposes BACKEND_BASE_URLS as a frozen object', () => {
		expect(Object.isFrozen(BACKEND_BASE_URLS)).toBe(true);
	});
});
