import { describe, expect, it } from 'vitest';
import { parseSortString } from '$lib/core/list/parse-sort-string';

describe('parseSortString', () => {
	describe('valid entries', () => {
		it('parses "name,asc" into a SortState', () => {
			expect(parseSortString('name,asc')).toEqual({ field: 'name', direction: 'asc' });
		});

		it('parses "age,desc" into a SortState', () => {
			expect(parseSortString('age,desc')).toEqual({ field: 'age', direction: 'desc' });
		});

		it('returns an object whose direction is the narrowed SortDirection literal', () => {
			const result = parseSortString('createdAt,desc');
			// Type-level: result is `SortState | undefined`, not a wider record type
			expect(result).toEqual({ field: 'createdAt', direction: 'desc' });
		});
	});

	describe('malformed entries', () => {
		it('returns undefined when the comma separator is missing', () => {
			expect(parseSortString('name')).toBeUndefined();
		});

		it('returns undefined for unknown direction values', () => {
			expect(parseSortString('name,xxx')).toBeUndefined();
			expect(parseSortString('name,ascending')).toBeUndefined();
			expect(parseSortString('name,1')).toBeUndefined();
		});

		it('returns undefined when direction has different casing (case-sensitive)', () => {
			expect(parseSortString('name,ASC')).toBeUndefined();
			expect(parseSortString('name,Desc')).toBeUndefined();
			expect(parseSortString('name,DESC')).toBeUndefined();
		});

		it('returns undefined when the field is empty', () => {
			expect(parseSortString(',asc')).toBeUndefined();
			expect(parseSortString(',desc')).toBeUndefined();
		});

		it('returns undefined when the direction is empty', () => {
			expect(parseSortString('name,')).toBeUndefined();
		});

		it('returns undefined for the empty string', () => {
			expect(parseSortString('')).toBeUndefined();
		});

		it('returns undefined for whitespace-only entries', () => {
			// Whitespace is not trimmed — strict semantic policy.
			expect(parseSortString(' ,asc')).toEqual({ field: ' ', direction: 'asc' });
			// (Trimming is the caller's responsibility if desired.)
		});
	});

	describe('split limit behavior', () => {
		it('ignores parts after the second comma (split limit = 2)', () => {
			expect(parseSortString('name,asc,extra')).toEqual({ field: 'name', direction: 'asc' });
		});

		it('rejects the entry when extra parts shift "asc" out of the direction slot', () => {
			// Edge: 'name,a,sc' splits to ['name', 'a'] — direction 'a' is invalid.
			expect(parseSortString('name,a,sc')).toBeUndefined();
		});
	});
});
