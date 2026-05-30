import { describe, expect, it } from 'vitest';

import { remapUserFilters } from '$lib/app/feature/user/api';
import type { Query } from '$lib/core/http';

describe('remapUserFilters', () => {
	it('rewrites loginId to the v1 ":contains" suffix', () => {
		const out = remapUserFilters({ loginId: 'tan' } as Query);
		expect(out).toEqual({ 'loginId:contains': 'tan' });
	});

	it('rewrites fullName to the v1 ":contains" suffix', () => {
		const out = remapUserFilters({ fullName: 'Tanaka' } as Query);
		expect(out).toEqual({ 'fullName:contains': 'Tanaka' });
	});

	it('rewrites both filters when present together', () => {
		const out = remapUserFilters({ loginId: 'tan', fullName: 'Tanaka' } as Query);
		expect(out).toEqual({
			'loginId:contains': 'tan',
			'fullName:contains': 'Tanaka'
		});
	});

	it('passes other keys through unchanged (builtins are remapped elsewhere)', () => {
		const out = remapUserFilters({
			_page: 1,
			_per_page: 20,
			_sort: '-updatedAt',
			loginId: 'foo'
		} as Query);
		expect(out).toEqual({
			_page: 1,
			_per_page: 20,
			_sort: '-updatedAt',
			'loginId:contains': 'foo'
		});
	});

	it('returns an empty object when no filters are present', () => {
		expect(remapUserFilters({} as Query)).toEqual({});
	});

	it('does not mutate the input query', () => {
		const input: Query = { loginId: 'a', fullName: 'b' } as Query;
		const snapshot = JSON.parse(JSON.stringify(input));
		remapUserFilters(input);
		expect(input).toEqual(snapshot);
	});

	it('preserves undefined-valued keys but converts them via the operator suffix', () => {
		// An explicit `undefined` becomes a `:contains` key, but core/http's
		// appendQuery skips undefined values, so the wire effect is "no key".
		const out = remapUserFilters({ loginId: undefined } as Query);
		expect(out).toEqual({ 'loginId:contains': undefined });
	});
});
