import { describe, expect, it } from 'vitest';
import { collapseSpaces } from '$lib/core/text/collapse-spaces';

describe('collapseSpaces', () => {
	it.each([
		['  Tanaka Kenji  ', 'Tanaka Kenji'], // trims half-width ends
		['　　Tanaka Kenji　　', 'Tanaka Kenji'], // trims full-width ends
		['Tanaka   Kenji', 'Tanaka Kenji'], // collapses consecutive spaces
		['Tanaka　Kenji', 'Tanaka Kenji'], // full-width separator → half-width
		['Tanaka 　 Kenji', 'Tanaka Kenji'], // mixed widths
		['Tanaka\t\nKenji', 'Tanaka Kenji'], // tabs / newlines
		['Tanaka Kenji', 'Tanaka Kenji'], // already canonical
		['', ''],
		['   ', ''], // half-width only
		['　　', ''] // full-width only
	])('collapseSpaces(%j) -> %j', (input, expected) => {
		expect(collapseSpaces(input)).toBe(expected);
	});

	it('is idempotent', () => {
		const once = collapseSpaces('　Tanaka　　Kenji　');
		expect(collapseSpaces(once)).toBe(once);
	});
});
