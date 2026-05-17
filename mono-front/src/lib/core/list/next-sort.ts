import type { SortDirection, SortState } from './types';

/**
 * Compute the next sort state after a header click. Pure function.
 *
 * @remarks Cycle pattern with `ascFirst=true` (default): `none → asc → desc → none`.
 *   With `ascFirst=false`: `none → desc → asc → none`. In multi mode an entry
 *   reaching `none` is removed; sibling entries keep their position. In single
 *   mode `current.length > 1` (legacy multi state) is discarded down to one entry.
 *
 * @remarks Plain clicks under `multiSort=true` should still pass `multi: false`
 *   (TanStack convention). Per-column `ascFirst` override is a future extension (§13).
 *
 * @param options.ascFirst default `true`.
 * @param options.multi default `false`.
 */
export function nextSortState(
	current: readonly SortState[],
	field: string,
	options?: { ascFirst?: boolean; multi?: boolean }
): SortState[] {
	const ascFirst = options?.ascFirst ?? true;
	const multi = options?.multi ?? false;
	const firstDirection: SortDirection = ascFirst ? 'asc' : 'desc';

	if (multi) {
		return nextMulti(current, field, firstDirection, ascFirst);
	}
	return nextSingle(current, field, firstDirection, ascFirst);
}

function nextSingle(
	current: readonly SortState[],
	field: string,
	firstDirection: SortDirection,
	ascFirst: boolean
): SortState[] {
	const head = current[0];
	if (head?.field !== field) {
		return [{ field, direction: firstDirection }];
	}
	const cycled = cycleDirection(head.direction, ascFirst);
	if (cycled === undefined) return [];
	return [{ field, direction: cycled }];
}

function nextMulti(
	current: readonly SortState[],
	field: string,
	firstDirection: SortDirection,
	ascFirst: boolean
): SortState[] {
	const index = current.findIndex((entry) => entry.field === field);
	if (index === -1) {
		return [...current, { field, direction: firstDirection }];
	}
	const cycled = cycleDirection(current[index].direction, ascFirst);
	if (cycled === undefined) {
		return [...current.slice(0, index), ...current.slice(index + 1)];
	}
	const next = [...current];
	next[index] = { field, direction: cycled };
	return next;
}

function cycleDirection(direction: SortDirection, ascFirst: boolean): SortDirection | undefined {
	if (ascFirst) {
		return direction === 'asc' ? 'desc' : undefined;
	}
	return direction === 'desc' ? 'asc' : undefined;
}
