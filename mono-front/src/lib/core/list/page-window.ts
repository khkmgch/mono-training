/**
 * Compute the page button window with ellipsis markers. Pure function.
 *
 * @remarks The middle window (around `page`) is shifted toward the closer
 *   boundary when it would otherwise fall short of `siblings * 2 + 1` entries,
 *   so the visible width around the current page stays stable even at the
 *   start/end of the range.
 *
 * @param page 0-based current page; out-of-range values are clamped to
 *   `[0, totalPages - 1]` (supports backend out-of-range echo).
 * @param totalPages total page count (`>= 0`); `0` returns `[]`.
 * @param options.siblings pages on each side of `page` (default `1`).
 * @param options.boundary pages pinned at first/last (default `1`).
 */
export function computePageWindow(
	page: number,
	totalPages: number,
	options?: { siblings?: number; boundary?: number }
): ReadonlyArray<number | 'ellipsis'> {
	if (totalPages <= 0) return [];
	const siblings = Math.max(0, options?.siblings ?? 1);
	const boundary = Math.max(0, options?.boundary ?? 1);

	const noEllipsisThreshold = boundary * 2 + siblings * 2 + 3;
	if (totalPages <= noEllipsisThreshold) {
		return range(0, totalPages - 1);
	}

	const p = Math.max(0, Math.min(page, totalPages - 1));

	const middleMinSize = siblings * 2 + 1;
	let middleStart = Math.max(0, p - siblings);
	let middleEnd = Math.min(totalPages - 1, p + siblings);

	const shortfall = middleMinSize - (middleEnd - middleStart + 1);
	if (shortfall > 0) {
		const rightCapacity = totalPages - 1 - middleEnd;
		const rightExtend = Math.min(shortfall, rightCapacity);
		middleEnd += rightExtend;
		const remaining = shortfall - rightExtend;
		if (remaining > 0) middleStart = Math.max(0, middleStart - remaining);
	}

	const indices = new Set<number>();
	for (let i = 0; i < Math.min(boundary, totalPages); i++) indices.add(i);
	for (let i = Math.max(totalPages - boundary, 0); i < totalPages; i++) indices.add(i);
	for (let i = middleStart; i <= middleEnd; i++) indices.add(i);

	const sorted = Array.from(indices).sort((a, b) => a - b);
	const result: Array<number | 'ellipsis'> = [];
	let previous = -1;
	for (const n of sorted) {
		if (previous !== -1 && n - previous > 1) result.push('ellipsis');
		result.push(n);
		previous = n;
	}
	return result;
}

function range(start: number, end: number): number[] {
	const out: number[] = [];
	for (let i = start; i <= end; i++) out.push(i);
	return out;
}
