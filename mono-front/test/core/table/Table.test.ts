import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, type Snippet } from 'svelte';
import TableFixture, { type Row } from './fixture/TableFixture.svelte';
import type { Column } from '$lib/core/table';
import type { SortState } from '$lib/core/list';

const rows: readonly Row[] = [
	{ id: '1', name: 'Alice', age: 30 },
	{ id: '2', name: 'Bob', age: null }
];

const columns: readonly Column<Row>[] = [
	{ id: 'name', header: 'Name', accessor: (r) => r.name, sortable: true },
	{ id: 'age', header: 'Age', accessor: (r) => r.age }
];

const baseProps = {
	rows,
	columns,
	getRowKey: (r: Row) => r.id,
	ariaLabel: 'Users'
} as const;

describe('Table', () => {
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	describe('basic rendering', () => {
		it('renders a <th scope="col"> for every column', () => {
			const { container } = render(TableFixture, { props: baseProps });
			const ths = container.querySelectorAll('th');
			expect(ths).toHaveLength(2);
			ths.forEach((th) => expect(th.getAttribute('scope')).toBe('col'));
		});

		it('renders one <tr> per row in <tbody>', () => {
			const { container } = render(TableFixture, { props: baseProps });
			const tbodyRows = container.querySelectorAll('tbody tr');
			expect(tbodyRows).toHaveLength(2);
		});

		it('applies the accessor and renders the value via renderCellValue', () => {
			const { container } = render(TableFixture, { props: baseProps });
			const ageCells = container.querySelectorAll('tbody tr td:nth-child(2)');
			expect(ageCells[0].textContent?.trim()).toBe('30');
			expect(ageCells[1].textContent?.trim()).toBe('');
		});

		it('applies aria-label to the <table>', () => {
			const { container } = render(TableFixture, { props: baseProps });
			expect(container.querySelector('table')?.getAttribute('aria-label')).toBe('Users');
		});

		it('renders <caption> when caption is provided', () => {
			const { container } = render(TableFixture, {
				props: { ...baseProps, caption: 'User list' }
			});
			expect(container.querySelector('caption')?.textContent).toBe('User list');
		});

		it('reflects loading prop as aria-busy on the <table>', () => {
			const { container } = render(TableFixture, { props: { ...baseProps, loading: true } });
			expect(container.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
		});

		it('renders cell Snippet when provided (overrides default renderer)', () => {
			const cellSnippet = createRawSnippet<
				[{ row: Row; column: Omit<Column<Row>, 'cell'>; value: unknown; index: number }]
			>((args) => ({
				render: () => {
					const { row } = args();
					return `<strong data-testid="custom-cell">[${row.name}]</strong>`;
				}
			}));
			const customColumns: readonly Column<Row>[] = [
				{
					id: 'name',
					header: 'Name',
					accessor: (r) => r.name,
					cell: cellSnippet
				}
			];
			const { container } = render(TableFixture, {
				props: { ...baseProps, columns: customColumns }
			});
			const customs = container.querySelectorAll('[data-testid="custom-cell"]');
			expect(customs).toHaveLength(2);
			expect(customs[0].textContent).toBe('[Alice]');
			expect(customs[1].textContent).toBe('[Bob]');
		});
	});

	describe('sortable columns', () => {
		it('does NOT render a <button> when sortable is false/undefined', () => {
			const { container } = render(TableFixture, { props: baseProps });
			const ageTh = container.querySelectorAll('th')[1];
			expect(ageTh.querySelector('button')).toBeNull();
		});

		it('renders a <button> with aria-label when sortable is true', () => {
			const { container } = render(TableFixture, { props: baseProps });
			const nameTh = container.querySelectorAll('th')[0];
			const button = nameTh.querySelector('button');
			expect(button).not.toBeNull();
			expect(button?.getAttribute('aria-label')).toBe('Sort by Name, none');
		});

		it('calls onSortChange with domain values (no DOM event) on click', async () => {
			const onSortChange = vi.fn();
			const { container } = render(TableFixture, {
				props: { ...baseProps, onSortChange }
			});
			const button = container.querySelector('th button')!;
			await fireEvent.click(button);
			expect(onSortChange).toHaveBeenCalledTimes(1);
			expect(onSortChange).toHaveBeenCalledWith([{ field: 'name', direction: 'asc' }]);
		});

		it('cycles asc → desc on the next click (single mode)', async () => {
			const onSortChange = vi.fn();
			const sort: SortState[] = [{ field: 'name', direction: 'asc' }];
			const { container } = render(TableFixture, {
				props: { ...baseProps, sort, onSortChange }
			});
			const button = container.querySelector('th button')!;
			await fireEvent.click(button);
			expect(onSortChange).toHaveBeenLastCalledWith([{ field: 'name', direction: 'desc' }]);
		});

		it('uses sortKey when present (overrides id)', async () => {
			const onSortChange = vi.fn();
			const cols: readonly Column<Row>[] = [
				{
					id: 'name',
					sortKey: 'fullName',
					header: 'Name',
					accessor: (r) => r.name,
					sortable: true
				}
			];
			const { container } = render(TableFixture, {
				props: { ...baseProps, columns: cols, onSortChange }
			});
			const button = container.querySelector('th button');
			if (button === null) throw new Error('sortable button not rendered');
			await fireEvent.click(button);
			expect(onSortChange).toHaveBeenCalledWith([{ field: 'fullName', direction: 'asc' }]);
		});

		it('renders the SR aria-label reflecting current direction', () => {
			const sort: SortState[] = [{ field: 'name', direction: 'desc' }];
			const { container } = render(TableFixture, { props: { ...baseProps, sort } });
			const button = container.querySelector('th button');
			expect(button?.getAttribute('aria-label')).toBe('Sort by Name, desc');
		});

		it('sets aria-sort on <th> based on current direction', () => {
			const sort: SortState[] = [{ field: 'name', direction: 'desc' }];
			const { container } = render(TableFixture, { props: { ...baseProps, sort } });
			const th = container.querySelectorAll('th')[0];
			expect(th.getAttribute('aria-sort')).toBe('descending');
		});
	});

	describe('multiSort', () => {
		const cols: readonly Column<Row>[] = [
			{ id: 'name', header: 'Name', accessor: (r) => r.name, sortable: true },
			{ id: 'age', header: 'Age', accessor: (r) => r.age, sortable: true }
		];

		it('shift+click adds a new sort entry when multiSort=true', async () => {
			const onSortChange = vi.fn();
			const sort: SortState[] = [{ field: 'name', direction: 'asc' }];
			const { container } = render(TableFixture, {
				props: { ...baseProps, columns: cols, sort, multiSort: true, onSortChange }
			});
			const ageButton = container.querySelectorAll('th button')[1]!;
			await fireEvent.click(ageButton, { shiftKey: true });
			expect(onSortChange).toHaveBeenCalledWith([
				{ field: 'name', direction: 'asc' },
				{ field: 'age', direction: 'asc' }
			]);
		});

		it('plain click while multiSort=true still single-resets (TanStack convention)', async () => {
			const onSortChange = vi.fn();
			const sort: SortState[] = [
				{ field: 'name', direction: 'asc' },
				{ field: 'age', direction: 'desc' }
			];
			const { container } = render(TableFixture, {
				props: { ...baseProps, columns: cols, sort, multiSort: true, onSortChange }
			});
			const ageButton = container.querySelectorAll('th button')[1]!;
			await fireEvent.click(ageButton, { shiftKey: false });
			// Single mode: same field as current head? No — head is 'name'. Different field → reset.
			expect(onSortChange).toHaveBeenCalledWith([{ field: 'age', direction: 'asc' }]);
		});

		it('shift+click while multiSort=false ignores the shift (still single mode)', async () => {
			const onSortChange = vi.fn();
			const sort: SortState[] = [
				{ field: 'name', direction: 'asc' },
				{ field: 'age', direction: 'desc' }
			];
			const { container } = render(TableFixture, {
				props: { ...baseProps, columns: cols, sort, multiSort: false, onSortChange }
			});
			const nameButton = container.querySelectorAll('th button')[0]!;
			await fireEvent.click(nameButton, { shiftKey: true });
			expect(onSortChange).toHaveBeenCalledWith([{ field: 'name', direction: 'desc' }]);
		});
	});

	describe('empty / noMatch / loadingSnippet fallback', () => {
		const emptySnippet: Snippet<[]> = createRawSnippet(() => ({
			render: () => '<p data-testid="empty">No data</p>'
		}));
		const noMatchSnippet: Snippet<[]> = createRawSnippet(() => ({
			render: () => '<p data-testid="no-match">Nothing found</p>'
		}));
		const loadingSnippet: Snippet<[]> = createRawSnippet(() => ({
			render: () => '<p data-testid="loading">Loading</p>'
		}));

		it('renders empty when only empty is provided and rows=[]', () => {
			const { queryByTestId } = render(TableFixture, {
				props: { ...baseProps, rows: [], empty: emptySnippet }
			});
			expect(queryByTestId('empty')).not.toBeNull();
		});

		it('prefers noMatch over empty when both are provided and rows=[]', () => {
			const { queryByTestId } = render(TableFixture, {
				props: { ...baseProps, rows: [], noMatch: noMatchSnippet, empty: emptySnippet }
			});
			expect(queryByTestId('no-match')).not.toBeNull();
			expect(queryByTestId('empty')).toBeNull();
		});

		it('renders loadingSnippet when loading=true and rows=[]', () => {
			const { queryByTestId } = render(TableFixture, {
				props: { ...baseProps, rows: [], loading: true, loadingSnippet }
			});
			expect(queryByTestId('loading')).not.toBeNull();
		});

		it('renders an empty <tbody> (aria-busy only) when loading=true + rows=[] + no loadingSnippet', () => {
			const { container } = render(TableFixture, {
				props: { ...baseProps, rows: [], loading: true }
			});
			expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
			expect(container.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
		});

		it('renders an empty <tbody> when rows=[] and neither empty/noMatch is provided', () => {
			const { container } = render(TableFixture, {
				props: { ...baseProps, rows: [] }
			});
			expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
		});
	});

	describe('CSS class hooks and width normalization', () => {
		it('applies .fixed when at least one column has width', () => {
			const cols: readonly Column<Row>[] = [
				{ id: 'name', header: 'Name', accessor: (r) => r.name, width: 150 },
				{ id: 'age', header: 'Age', accessor: (r) => r.age }
			];
			const { container } = render(TableFixture, { props: { ...baseProps, columns: cols } });
			expect(container.querySelector('table')?.classList.contains('fixed')).toBe(true);
		});

		it('does NOT apply .fixed when no column has width', () => {
			const { container } = render(TableFixture, { props: baseProps });
			expect(container.querySelector('table')?.classList.contains('fixed')).toBe(false);
		});

		it('applies .striped when striped=true', () => {
			const { container } = render(TableFixture, { props: { ...baseProps, striped: true } });
			expect(container.querySelector('table')?.classList.contains('striped')).toBe(true);
		});

		it('applies .wrap when wrap=true', () => {
			const { container } = render(TableFixture, { props: { ...baseProps, wrap: true } });
			expect(container.querySelector('table')?.classList.contains('wrap')).toBe(true);
		});

		it('normalizes numeric width to `${n}px` on <col>', () => {
			const cols: readonly Column<Row>[] = [
				{ id: 'name', header: 'Name', accessor: (r) => r.name, width: 150 }
			];
			const { container } = render(TableFixture, { props: { ...baseProps, columns: cols } });
			expect(container.querySelector('col')?.getAttribute('style')).toContain('width: 150px');
		});

		it('passes string width through as-is', () => {
			const cols: readonly Column<Row>[] = [
				{ id: 'name', header: 'Name', accessor: (r) => r.name, width: '30%' }
			];
			const { container } = render(TableFixture, { props: { ...baseProps, columns: cols } });
			expect(container.querySelector('col')?.getAttribute('style')).toContain('width: 30%');
		});
	});

	describe('dev warnings', () => {
		it('warns when neither caption nor ariaLabel is provided', () => {
			render(TableFixture, {
				props: { rows, columns, getRowKey: (r: Row) => r.id }
			});
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('`caption` or `ariaLabel`')
			);
		});

		it('Svelte runtime errors on duplicate column ids (each-key invariant)', () => {
			// `{#each columns as col (col.id)}` enforces unique keys in dev mode.
			// This replaces the original `$effect` warning (which was unreachable —
			// Svelte throws before the effect runs).
			const dupColumns: readonly Column<Row>[] = [
				{ id: 'name', header: 'A' },
				{ id: 'name', header: 'B' }
			];
			expect(() => render(TableFixture, { props: { ...baseProps, columns: dupColumns } })).toThrow(
				/each_key_duplicate/
			);
		});

		it('warns when a Snippet header is missing label (runtime backup for the TS error)', () => {
			const headerSnippet: Snippet<[]> = createRawSnippet(() => ({
				render: () => '<span>Custom</span>'
			}));
			// Cast bypasses the discriminated-union TS error to exercise the runtime guard.
			const cols = [{ id: 'x', header: headerSnippet } as unknown as Column<Row>] as const;
			render(TableFixture, { props: { ...baseProps, columns: cols } });
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('Snippet header but has no `label`')
			);
		});
	});
});
