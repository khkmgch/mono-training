import { describe, expect, it } from 'vitest';
import { renderCellValue } from '$lib/core/list/render-cell';

describe('renderCellValue', () => {
	describe('null / undefined / NaN → empty string', () => {
		it('returns "" for null', () => {
			expect(renderCellValue(null)).toBe('');
		});

		it('returns "" for undefined', () => {
			expect(renderCellValue(undefined)).toBe('');
		});

		it('returns "" for NaN', () => {
			expect(renderCellValue(NaN)).toBe('');
		});

		it('returns "" for NaN produced by arithmetic on undefined', () => {
			expect(renderCellValue(Number(undefined))).toBe('');
		});
	});

	describe('primitives', () => {
		it('returns the same string for non-empty strings', () => {
			expect(renderCellValue('hello')).toBe('hello');
		});

		it('returns "" for an explicit empty string', () => {
			expect(renderCellValue('')).toBe('');
		});

		it('returns "0" for 0 (does not collapse to empty)', () => {
			expect(renderCellValue(0)).toBe('0');
		});

		it('returns "false" for false (does not collapse to empty)', () => {
			expect(renderCellValue(false)).toBe('false');
		});

		it('returns "true" for true', () => {
			expect(renderCellValue(true)).toBe('true');
		});

		it('stringifies positive and negative integers', () => {
			expect(renderCellValue(42)).toBe('42');
			expect(renderCellValue(-7)).toBe('-7');
		});

		it('stringifies floats', () => {
			expect(renderCellValue(1.5)).toBe('1.5');
		});
	});

	describe('infinities pass through (only NaN is suppressed)', () => {
		it('renders "Infinity" for Number.POSITIVE_INFINITY', () => {
			expect(renderCellValue(Infinity)).toBe('Infinity');
		});

		it('renders "-Infinity" for Number.NEGATIVE_INFINITY', () => {
			expect(renderCellValue(-Infinity)).toBe('-Infinity');
		});
	});

	describe('non-primitives use String() coercion', () => {
		it('coerces a Date via its default toString', () => {
			const date = new Date('2026-05-17T00:00:00Z');
			expect(renderCellValue(date)).toBe(String(date));
		});

		it('coerces a plain object to [object Object]', () => {
			expect(renderCellValue({})).toBe('[object Object]');
		});

		it('coerces an array via Array#toString (comma-joined)', () => {
			expect(renderCellValue([1, 2, 3])).toBe('1,2,3');
		});

		it('returns "" for an empty array (Array#toString of [] is "")', () => {
			expect(renderCellValue([])).toBe('');
		});

		it('coerces a bigint to its decimal string', () => {
			expect(renderCellValue(10n)).toBe('10');
		});

		it('coerces a symbol description via String()', () => {
			const sym = Symbol('s');
			expect(renderCellValue(sym)).toBe('Symbol(s)');
		});
	});
});
