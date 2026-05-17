import { describe, expect, it } from 'vitest';
import { nextSortState } from '$lib/core/list/next-sort';
import type { SortState } from '$lib/core/list/types';

describe('nextSortState', () => {
	describe('single mode (default, multi=false)', () => {
		describe('current is empty', () => {
			it('adds a new entry with asc when ascFirst=true (default)', () => {
				expect(nextSortState([], 'name')).toEqual([{ field: 'name', direction: 'asc' }]);
			});

			it('adds a new entry with desc when ascFirst=false', () => {
				expect(nextSortState([], 'name', { ascFirst: false })).toEqual([
					{ field: 'name', direction: 'desc' }
				]);
			});
		});

		describe('same field as current[0]', () => {
			const startAsc: SortState[] = [{ field: 'name', direction: 'asc' }];
			const startDesc: SortState[] = [{ field: 'name', direction: 'desc' }];

			it('ascFirst=true: asc → desc', () => {
				expect(nextSortState(startAsc, 'name')).toEqual([{ field: 'name', direction: 'desc' }]);
			});

			it('ascFirst=true: desc → none (empty array)', () => {
				expect(nextSortState(startDesc, 'name')).toEqual([]);
			});

			it('ascFirst=false: desc → asc', () => {
				expect(nextSortState(startDesc, 'name', { ascFirst: false })).toEqual([
					{ field: 'name', direction: 'asc' }
				]);
			});

			it('ascFirst=false: asc → none (empty array)', () => {
				expect(nextSortState(startAsc, 'name', { ascFirst: false })).toEqual([]);
			});
		});

		describe('different field', () => {
			it('resets to a new single entry with default direction', () => {
				const start: SortState[] = [{ field: 'age', direction: 'desc' }];
				expect(nextSortState(start, 'name')).toEqual([{ field: 'name', direction: 'asc' }]);
			});

			it('respects ascFirst=false on reset', () => {
				const start: SortState[] = [{ field: 'age', direction: 'asc' }];
				expect(nextSortState(start, 'name', { ascFirst: false })).toEqual([
					{ field: 'name', direction: 'desc' }
				]);
			});
		});

		describe('current with multiple entries (legacy multi state)', () => {
			const legacy: SortState[] = [
				{ field: 'name', direction: 'asc' },
				{ field: 'age', direction: 'desc' }
			];

			it('discards additional entries when cycling the head', () => {
				expect(nextSortState(legacy, 'name')).toEqual([{ field: 'name', direction: 'desc' }]);
			});

			it('discards everything when the click is on a new field', () => {
				expect(nextSortState(legacy, 'createdAt')).toEqual([
					{ field: 'createdAt', direction: 'asc' }
				]);
			});
		});

		it('does not mutate the input array', () => {
			const start: SortState[] = [{ field: 'name', direction: 'asc' }];
			const snapshot = JSON.parse(JSON.stringify(start)) as SortState[];
			nextSortState(start, 'name');
			expect(start).toEqual(snapshot);
		});
	});

	describe('multi mode (multi=true)', () => {
		describe('field not present in current', () => {
			it('appends a new entry with asc when ascFirst=true', () => {
				const start: SortState[] = [{ field: 'name', direction: 'asc' }];
				expect(nextSortState(start, 'age', { multi: true })).toEqual([
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'asc' }
				]);
			});

			it('appends a new entry with desc when ascFirst=false', () => {
				const start: SortState[] = [{ field: 'name', direction: 'asc' }];
				expect(nextSortState(start, 'age', { multi: true, ascFirst: false })).toEqual([
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'desc' }
				]);
			});

			it('starts a new list when current is empty', () => {
				expect(nextSortState([], 'name', { multi: true })).toEqual([
					{ field: 'name', direction: 'asc' }
				]);
			});
		});

		describe('field exists in current', () => {
			it('cycles existing entry direction (asc → desc) and preserves order', () => {
				const start: SortState[] = [
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'asc' }
				];
				expect(nextSortState(start, 'age', { multi: true })).toEqual([
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'desc' }
				]);
			});

			it('removes the entry when cycle reaches none, preserving siblings', () => {
				const start: SortState[] = [
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'desc' },
					{ field: 'createdAt', direction: 'asc' }
				];
				expect(nextSortState(start, 'age', { multi: true })).toEqual([
					{ field: 'name', direction: 'asc' },
					{ field: 'createdAt', direction: 'asc' }
				]);
			});

			it('removes the only entry when cycle reaches none', () => {
				const start: SortState[] = [{ field: 'name', direction: 'desc' }];
				expect(nextSortState(start, 'name', { multi: true })).toEqual([]);
			});

			it('cycles desc → asc when ascFirst=false', () => {
				const start: SortState[] = [
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'desc' }
				];
				expect(nextSortState(start, 'age', { multi: true, ascFirst: false })).toEqual([
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'asc' }
				]);
			});
		});

		it('does not mutate the input array', () => {
			const start: SortState[] = [
				{ field: 'name', direction: 'asc' },
				{ field: 'age', direction: 'asc' }
			];
			const snapshot = JSON.parse(JSON.stringify(start)) as SortState[];
			nextSortState(start, 'age', { multi: true });
			expect(start).toEqual(snapshot);
		});
	});
});
