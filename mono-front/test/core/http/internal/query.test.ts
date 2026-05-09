import { describe, expect, it } from 'vitest';
import { appendQuery } from '$lib/core/http/internal/query';

describe('appendQuery', () => {
	it('returns the same URL when query is undefined', () => {
		const url = new URL('https://api.example.com/users');
		expect(appendQuery(url).toString()).toBe('https://api.example.com/users');
	});

	it('returns a new URL instance instead of mutating the input', () => {
		const url = new URL('https://api.example.com/users');
		const result = appendQuery(url, { active: true });
		expect(result).not.toBe(url);
		expect(url.search).toBe('');
		expect(result.search).toBe('?active=true');
	});

	it('serializes string / number / boolean values', () => {
		const result = appendQuery(new URL('https://x.test/p'), {
			name: 'alice',
			age: 30,
			active: true
		});
		const params = result.searchParams;
		expect(params.get('name')).toBe('alice');
		expect(params.get('age')).toBe('30');
		expect(params.get('active')).toBe('true');
	});

	it('skips null and undefined values', () => {
		const result = appendQuery(new URL('https://x.test/p'), {
			cursor: null,
			filter: undefined,
			page: 1
		});
		expect(result.searchParams.has('cursor')).toBe(false);
		expect(result.searchParams.has('filter')).toBe(false);
		expect(result.searchParams.get('page')).toBe('1');
	});

	it('serializes array values as repeated keys', () => {
		const result = appendQuery(new URL('https://x.test/p'), {
			role: ['admin', 'editor']
		});
		expect(result.searchParams.getAll('role')).toEqual(['admin', 'editor']);
	});

	it('skips null/undefined inside array values', () => {
		const result = appendQuery(new URL('https://x.test/p'), {
			tag: ['a', null, undefined, 'b']
		});
		expect(result.searchParams.getAll('tag')).toEqual(['a', 'b']);
	});

	it('preserves existing query parameters in the URL', () => {
		const url = new URL('https://x.test/p?existing=1');
		const result = appendQuery(url, { added: 'yes' });
		expect(result.searchParams.get('existing')).toBe('1');
		expect(result.searchParams.get('added')).toBe('yes');
	});

	it('treats an empty object as a no-op (returns equivalent URL)', () => {
		const url = new URL('https://x.test/p?keep=1');
		const result = appendQuery(url, {});
		expect(result.toString()).toBe('https://x.test/p?keep=1');
	});

	it('URL-encodes special characters via URLSearchParams', () => {
		const result = appendQuery(new URL('https://x.test/p'), { q: 'a b&c=d' });
		expect(result.search).toBe('?q=a+b%26c%3Dd');
	});
});
