import { describe, expect, it } from 'vitest';
import { mergeHeaders } from '$lib/core/http/internal/headers';

describe('mergeHeaders', () => {
	it('returns an empty Headers when no sources are provided', () => {
		const result = mergeHeaders();
		expect([...result]).toEqual([]);
	});

	it('skips undefined sources', () => {
		const result = mergeHeaders(undefined, { 'X-A': '1' }, undefined);
		expect(result.get('X-A')).toBe('1');
	});

	it('merges default and per-request headers, with per-request winning', () => {
		const result = mergeHeaders(
			{ 'Content-Type': 'application/json', 'X-Default': 'd' },
			{ 'Content-Type': 'text/plain', 'X-Override': 'o' }
		);
		expect(result.get('Content-Type')).toBe('text/plain');
		expect(result.get('X-Default')).toBe('d');
		expect(result.get('X-Override')).toBe('o');
	});

	it('treats header names case-insensitively', () => {
		const result = mergeHeaders(
			{ 'content-type': 'application/json' },
			{ 'Content-Type': 'text/plain' }
		);
		expect(result.get('CONTENT-TYPE')).toBe('text/plain');
	});

	it('accepts the array form of HeadersInit', () => {
		const result = mergeHeaders([
			['X-One', '1'],
			['X-Two', '2']
		]);
		expect(result.get('X-One')).toBe('1');
		expect(result.get('X-Two')).toBe('2');
	});

	it('accepts a Headers instance as a source', () => {
		const incoming = new Headers({ Authorization: 'Bearer token' });
		const result = mergeHeaders({ 'X-Default': 'd' }, incoming);
		expect(result.get('Authorization')).toBe('Bearer token');
		expect(result.get('X-Default')).toBe('d');
	});

	it('does not interpret undefined values as deletions (HeadersInit type forbids them)', () => {
		// HeadersInit's Record form already forbids `undefined` values at the type level.
		// This test asserts that a header explicitly set in an earlier source survives a
		// later source that simply does not mention it.
		const result = mergeHeaders({ 'X-Keep': 'yes' }, { 'X-Other': '1' });
		expect(result.get('X-Keep')).toBe('yes');
	});
});
