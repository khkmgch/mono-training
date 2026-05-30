import { describe, expect, it } from 'vitest';
import { getNumber, getString } from '$lib/app/shared/server';

const fdWith = (entries: Record<string, string | File>): FormData => {
	const fd = new FormData();
	for (const [key, value] of Object.entries(entries)) fd.set(key, value);
	return fd;
};

describe('getString', () => {
	it('returns the string entry as-is', () => {
		expect(getString(fdWith({ name: 'taro' }), 'name')).toBe('taro');
	});

	it('returns the empty string for missing keys (default fallback)', () => {
		expect(getString(fdWith({}), 'missing')).toBe('');
	});

	it('returns the provided fallback for missing keys', () => {
		expect(getString(fdWith({}), 'missing', 'fallback')).toBe('fallback');
	});

	it('returns the fallback when the entry is a File (never stringifies to [object File])', () => {
		const file = new File(['content'], 'doc.txt', { type: 'text/plain' });
		expect(getString(fdWith({ upload: file }), 'upload', 'fallback')).toBe('fallback');
	});

	it('preserves an empty string entry as ""', () => {
		expect(getString(fdWith({ name: '' }), 'name', 'fallback')).toBe('');
	});
});

describe('getNumber', () => {
	it('parses a finite numeric string', () => {
		expect(getNumber(fdWith({ version: '42' }), 'version')).toBe(42);
	});

	it('parses negative and decimal numbers', () => {
		expect(getNumber(fdWith({ x: '-3.14' }), 'x')).toBe(-3.14);
	});

	it('returns the default fallback (0) for missing keys', () => {
		expect(getNumber(fdWith({}), 'missing')).toBe(0);
	});

	it('returns the provided fallback for missing keys', () => {
		expect(getNumber(fdWith({}), 'missing', 99)).toBe(99);
	});

	it('returns the fallback when the entry is a File', () => {
		const file = new File(['1'], 'one.txt', { type: 'text/plain' });
		expect(getNumber(fdWith({ upload: file }), 'upload', 99)).toBe(99);
	});

	it('returns the fallback for non-numeric strings (NaN guard)', () => {
		expect(getNumber(fdWith({ x: 'abc' }), 'x', 99)).toBe(99);
	});

	it('returns 0 for empty strings (Number("") === 0 passes the finite check)', () => {
		expect(getNumber(fdWith({ x: '' }), 'x', 99)).toBe(0);
	});

	it('returns the fallback for Infinity', () => {
		expect(getNumber(fdWith({ x: 'Infinity' }), 'x', 99)).toBe(99);
	});
});
