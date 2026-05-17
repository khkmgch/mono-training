import { describe, expect, it } from 'vitest';
import { computePageWindow } from '$lib/core/list/page-window';

describe('computePageWindow', () => {
	describe('edge cases', () => {
		it('returns [] when totalPages is 0', () => {
			expect(computePageWindow(0, 0)).toEqual([]);
		});

		it('returns [] when totalPages is negative', () => {
			expect(computePageWindow(0, -1)).toEqual([]);
		});

		it('returns [0] when totalPages is 1', () => {
			expect(computePageWindow(0, 1)).toEqual([0]);
		});

		it('returns [0, 1] when totalPages is 2', () => {
			expect(computePageWindow(1, 2)).toEqual([0, 1]);
		});
	});

	describe('no ellipsis (totalPages <= threshold)', () => {
		it('returns all pages when totalPages equals threshold (default 7)', () => {
			// boundary=1, siblings=1: threshold = 1*2 + 1*2 + 3 = 7
			expect(computePageWindow(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		});

		it('returns all pages when totalPages is below threshold', () => {
			expect(computePageWindow(2, 5)).toEqual([0, 1, 2, 3, 4]);
		});
	});

	describe('ellipsis with default boundary=1, siblings=1', () => {
		it('inserts ellipsis on both sides for a middle page', () => {
			expect(computePageWindow(4, 10)).toEqual([0, 'ellipsis', 3, 4, 5, 'ellipsis', 9]);
		});

		it('extends the middle window when current page is near start (no left ellipsis)', () => {
			expect(computePageWindow(0, 10)).toEqual([0, 1, 2, 'ellipsis', 9]);
		});

		it('extends the middle window when current page is near end (no right ellipsis)', () => {
			expect(computePageWindow(9, 10)).toEqual([0, 'ellipsis', 7, 8, 9]);
		});

		it('produces the same window for adjacent-to-boundary pages', () => {
			expect(computePageWindow(1, 10)).toEqual([0, 1, 2, 'ellipsis', 9]);
		});

		it('keeps middle window size stable when current is one off from boundary', () => {
			expect(computePageWindow(8, 10)).toEqual([0, 'ellipsis', 7, 8, 9]);
		});
	});

	describe('out-of-range page (clamp)', () => {
		it('treats page >= totalPages as page = totalPages - 1', () => {
			expect(computePageWindow(999, 10)).toEqual([0, 'ellipsis', 7, 8, 9]);
		});

		it('clamps negative page to 0', () => {
			expect(computePageWindow(-5, 10)).toEqual([0, 1, 2, 'ellipsis', 9]);
		});
	});

	describe('custom siblings / boundary', () => {
		it('siblings=2: middle is 5 entries wide', () => {
			expect(computePageWindow(5, 20, { siblings: 2 })).toEqual([
				0,
				'ellipsis',
				3,
				4,
				5,
				6,
				7,
				'ellipsis',
				19
			]);
		});

		it('boundary=2: start and end each show 2 pages', () => {
			expect(computePageWindow(5, 15, { boundary: 2 })).toEqual([
				0,
				1,
				'ellipsis',
				4,
				5,
				6,
				'ellipsis',
				13,
				14
			]);
		});

		it('siblings=0, boundary=0: shows only the current page', () => {
			// threshold = 0 + 0 + 3 = 3; totalPages 10 > 3 → ellipsis mode
			expect(computePageWindow(4, 10, { siblings: 0, boundary: 0 })).toEqual([4]);
		});

		it('boundary=0: no fixed start/end pages', () => {
			expect(computePageWindow(5, 12, { boundary: 0 })).toEqual([4, 5, 6]);
		});

		it('negative siblings / boundary are floored to 0', () => {
			expect(computePageWindow(5, 12, { siblings: -1, boundary: -2 })).toEqual([5]);
		});
	});

	describe('window merging (no spurious ellipsis between adjacent indices)', () => {
		it('keeps middle adjacent to start boundary without an ellipsis between them', () => {
			// boundary=1, siblings=1, totalPages=10, page=1
			// middle = [0,1,2] (right-extended), start boundary = [0]
			// → 0/1/2 are contiguous; only the gap between 2 and 9 inserts ellipsis.
			expect(computePageWindow(1, 10)).toEqual([0, 1, 2, 'ellipsis', 9]);
		});

		it('keeps middle adjacent to end boundary without an ellipsis between them', () => {
			// page=8 → middle = [7,8,9] (left-extended), end boundary = [9]
			// → 7/8/9 are contiguous; only the gap between 0 and 7 inserts ellipsis.
			expect(computePageWindow(8, 10)).toEqual([0, 'ellipsis', 7, 8, 9]);
		});
	});
});
