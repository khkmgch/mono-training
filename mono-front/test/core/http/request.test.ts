import { describe, expect, it } from 'vitest';
import { resolveUrl } from '$lib/core/http/request';

describe('resolveUrl', () => {
	it('returns the input directly when it is already a URL instance', () => {
		const input = new URL('https://api.example.com/users/1');
		expect(resolveUrl(input)).toBe(input);
	});

	it('returns a new URL when the path is an absolute string, ignoring baseURL', () => {
		const result = resolveUrl('https://api.example.com/users', 'https://other.test/');
		expect(result.toString()).toBe('https://api.example.com/users');
	});

	it('resolves a relative path against a string baseURL', () => {
		const result = resolveUrl('/users/1', 'https://api.example.com');
		expect(result.toString()).toBe('https://api.example.com/users/1');
	});

	it('resolves a relative path against a URL baseURL', () => {
		const result = resolveUrl('/users/1', new URL('https://api.example.com'));
		expect(result.toString()).toBe('https://api.example.com/users/1');
	});

	it('preserves the baseURL path segment when baseURL ends with a slash and path is relative without leading slash', () => {
		const result = resolveUrl('users', 'https://api.example.com/api/');
		expect(result.toString()).toBe('https://api.example.com/api/users');
	});

	it('discards the baseURL path segment when path starts with a slash (per WHATWG URL semantics)', () => {
		const result = resolveUrl('/users', 'https://api.example.com/api/');
		expect(result.toString()).toBe('https://api.example.com/users');
	});

	it('throws TypeError when path is relative and baseURL is undefined', () => {
		expect(() => resolveUrl('/users')).toThrow(TypeError);
	});

	it('throws TypeError when path is relative and baseURL is malformed', () => {
		expect(() => resolveUrl('/users', 'not a url')).toThrow();
	});
});
