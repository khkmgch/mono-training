import { describe, expect, it } from 'vitest';
import { stripSpaces } from '$lib/core/text/strip-spaces';

describe('stripSpaces', () => {
	it.each([
		['  admin  ', 'admin'], // trims ends
		['a b c', 'abc'], // removes internal half-width
		['a　b　c', 'abc'], // removes internal full-width
		['a\tb\nc', 'abc'], // tabs / newlines
		['admin01', 'admin01'], // no spaces unchanged
		['', ''],
		['  　  ', ''] // spaces only (half- and full-width)
	])('stripSpaces(%j) -> %j', (input, expected) => {
		expect(stripSpaces(input)).toBe(expected);
	});

	it('is idempotent', () => {
		const once = stripSpaces('  a b c  ');
		expect(stripSpaces(once)).toBe(once);
	});
});
