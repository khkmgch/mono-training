import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet, type Snippet } from 'svelte';
import type { PageResult } from '$lib/core/list';
import type { OutOfRangeSnippetContext } from '$lib/app/shared/ui/list';
import type { Row } from './fixture/ProviderWithDataTable.svelte';

const mocks = vi.hoisted(() => {
	let currentUrl = new URL('https://example.test/users');
	let currentBrowser = true;
	let navigatingTarget: { url: URL } | null = null;
	return {
		setUrl(u: URL): void {
			currentUrl = u;
		},
		setBrowser(b: boolean): void {
			currentBrowser = b;
		},
		setNavigatingTarget(n: { url: URL } | null): void {
			navigatingTarget = n;
		},
		readUrl(): URL {
			return currentUrl;
		},
		readBrowser(): boolean {
			return currentBrowser;
		},
		readNavigatingTarget(): { url: URL } | null {
			return navigatingTarget;
		},
		goto: vi.fn()
	};
});

vi.mock('$app/state', () => ({
	page: {
		get url() {
			return mocks.readUrl();
		}
	},
	navigating: {
		get to() {
			return mocks.readNavigatingTarget();
		}
	}
}));

vi.mock('$app/environment', () => ({
	get browser() {
		return mocks.readBrowser();
	}
}));

vi.mock('$app/navigation', () => ({
	goto: mocks.goto
}));

const [{ createListBinding }, { default: DataTable }, { default: ProviderWithDataTable }] =
	await Promise.all([
		import('$lib/app/shared/ui/list'),
		import('$lib/app/shared/ui/list/component/DataTable.svelte'),
		import('./fixture/ProviderWithDataTable.svelte')
	]);

const rows: readonly Row[] = [
	{ id: '1', name: 'Alice' },
	{ id: '2', name: 'Bob' }
];

const columns = [{ id: 'name', header: 'Name', accessor: (r: Row) => r.name }];

const baseBinding = createListBinding();

function buildFixtureProps(overrides: {
	result: PageResult<Row>;
	query?: ReturnType<typeof baseBinding.parse>;
	loading?: boolean;
	clampOutOfRangePage?: boolean;
	empty?: Snippet<[]>;
	noMatch?: Snippet<[]>;
	outOfRange?: Snippet<[OutOfRangeSnippetContext]>;
	caption?: string;
	ariaLabel?: string;
}) {
	return {
		binding: baseBinding,
		query: overrides.query ?? baseBinding.parse(new URL('https://example.test/')),
		result: overrides.result,
		columns,
		getRowKey: (r: Row) => r.id,
		caption: overrides.caption,
		ariaLabel: overrides.ariaLabel,
		empty: overrides.empty,
		noMatch: overrides.noMatch,
		outOfRange: overrides.outOfRange,
		loading: overrides.loading,
		clampOutOfRangePage: overrides.clampOutOfRangePage
	};
}

beforeEach(() => {
	mocks.setUrl(new URL('https://example.test/users'));
	mocks.setBrowser(true);
	mocks.setNavigatingTarget(null);
	mocks.goto.mockReset();
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('DataTable', () => {
	describe('ListProvider scope', () => {
		it('throws when rendered outside any <ListProvider>', () => {
			// Generic DataTable widens to TRow=unknown when rendered directly via
			// @testing-library/svelte; cast through `never` so the type checker stays out of the way.
			expect(() =>
				render(DataTable, {
					props: {
						columns,
						getRowKey: (r: Row) => r.id
					} as never
				})
			).toThrow(/within a <ListProvider>/);
		});
	});

	describe('table identification (caption / ariaLabel passthrough)', () => {
		it('renders <caption> when `caption` is provided', () => {
			const result = { items: rows, page: 0, size: 20, totalCount: 2, totalPages: 1 };
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, caption: 'User list' })
			});
			expect(container.querySelector('caption')?.textContent).toBe('User list');
		});

		it('applies `aria-label` to <table> when `ariaLabel` is provided', () => {
			const result = { items: rows, page: 0, size: 20, totalCount: 2, totalPages: 1 };
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, ariaLabel: 'Users' })
			});
			expect(container.querySelector('table')?.getAttribute('aria-label')).toBe('Users');
		});

		it('emits the Table dev warning when neither is provided (caller-induced)', () => {
			const result = { items: rows, page: 0, size: 20, totalCount: 2, totalPages: 1 };
			render(ProviderWithDataTable, { props: buildFixtureProps({ result }) });
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('`caption` or `ariaLabel`')
			);
		});
	});

	describe('happy path', () => {
		it('renders Table rows from result.items', () => {
			const result = {
				items: rows,
				page: 0,
				size: 20,
				totalCount: 2,
				totalPages: 1
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			const dataRows = container.querySelectorAll('tbody tr');
			expect(dataRows).toHaveLength(2);
			expect(container.textContent).toContain('Alice');
			expect(container.textContent).toContain('Bob');
		});

		it('renders Pagination when totalCount > 0', () => {
			const result = {
				items: rows,
				page: 0,
				size: 20,
				totalCount: 2,
				totalPages: 1
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelector('nav')).not.toBeNull();
		});

		it('does NOT render Pagination when totalCount === 0', () => {
			const result = {
				items: [],
				page: 0,
				size: 20,
				totalCount: 0,
				totalPages: 0
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelector('nav')).toBeNull();
		});
	});

	describe('empty / noMatch fallback', () => {
		it('renders DefaultEmpty when totalCount === 0 and no Snippets', () => {
			const result = {
				items: [],
				page: 0,
				size: 20,
				totalCount: 0,
				totalPages: 0
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelector('.ds-list-empty')).not.toBeNull();
		});

		it('renders custom empty when totalCount === 0 and !hasActiveSearchParams', () => {
			const result = {
				items: [],
				page: 0,
				size: 20,
				totalCount: 0,
				totalPages: 0
			};
			const empty = createRawSnippet(() => ({
				render: () => '<p data-testid="custom-empty">Nothing here</p>'
			}));
			const { queryByTestId } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, empty })
			});
			expect(queryByTestId('custom-empty')).not.toBeNull();
		});

		it('renders noMatch when totalCount === 0 and hasActiveSearchParams (q present)', () => {
			const result = {
				items: [],
				page: 0,
				size: 20,
				totalCount: 0,
				totalPages: 0
			};
			const query = baseBinding.parse(new URL('https://example.test/?q=needle'));
			const noMatch = createRawSnippet(() => ({
				render: () => '<p data-testid="no-match">No matches</p>'
			}));
			const { queryByTestId } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, query, noMatch })
			});
			expect(queryByTestId('no-match')).not.toBeNull();
		});

		it('falls back to empty when noMatch is absent and hasActiveSearchParams', () => {
			const result = {
				items: [],
				page: 0,
				size: 20,
				totalCount: 0,
				totalPages: 0
			};
			const query = baseBinding.parse(new URL('https://example.test/?q=needle'));
			const empty = createRawSnippet(() => ({
				render: () => '<p data-testid="empty-fallback">Empty fallback</p>'
			}));
			const { queryByTestId } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, query, empty })
			});
			expect(queryByTestId('empty-fallback')).not.toBeNull();
		});
	});

	describe('out-of-range', () => {
		it('renders DefaultOutOfRange when page >= totalPages and totalCount > 0', () => {
			const result = {
				items: [],
				page: 999,
				size: 20,
				totalCount: 50,
				totalPages: 3
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelector('.ds-list-out-of-range')).not.toBeNull();
		});

		it('auto-navigates (replaceState: true) to the clamped page when clampOutOfRangePage=true', () => {
			const result = {
				items: [],
				page: 999,
				size: 20,
				totalCount: 50,
				totalPages: 3
			};
			render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, clampOutOfRangePage: true })
			});
			expect(mocks.goto).toHaveBeenCalledOnce();
			const [navUrl, navOptions] = mocks.goto.mock.calls[0];
			expect((navUrl as URL).searchParams.get('page')).toBe('2');
			expect(navOptions).toMatchObject({ replaceState: true });
		});

		it('does NOT auto-navigate when clampOutOfRangePage is false (default)', () => {
			const result = {
				items: [],
				page: 999,
				size: 20,
				totalCount: 50,
				totalPages: 3
			};
			render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(mocks.goto).not.toHaveBeenCalled();
		});

		it('does not call toast on auto-clamp', () => {
			const result = {
				items: [],
				page: 999,
				size: 20,
				totalCount: 50,
				totalPages: 3
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, clampOutOfRangePage: true })
			});
			expect(container.querySelector('[role="alert"]')).toBeNull();
			expect(container.querySelector('.ds-list-out-of-range')).not.toBeNull();
		});

		it('passes a replaceState navigate to the outOfRange Snippet', () => {
			// Out-of-range means the URL actually carries the bad page (?page=999).
			// Set it so the clamped navigate resolves to a *different* URL — under
			// the same-URL skip guard, navigating to the current URL is a no-op.
			mocks.setUrl(new URL('https://example.test/users?page=999'));
			const result = {
				items: [],
				page: 999,
				size: 20,
				totalCount: 50,
				totalPages: 3
			};
			let receivedNavigate: ((page: number) => void) | undefined;
			const outOfRange = createRawSnippet<[OutOfRangeSnippetContext]>((args) => ({
				render: () => '<div data-testid="out-of-range-custom"></div>',
				setup: () => {
					receivedNavigate = args().navigate;
				}
			}));
			render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, outOfRange })
			});
			expect(receivedNavigate).toBeTypeOf('function');
			receivedNavigate?.(0);
			expect(mocks.goto).toHaveBeenCalledOnce();
			expect(mocks.goto.mock.calls[0][1]).toMatchObject({ replaceState: true });
		});
	});

	describe('footer (summary + Pagination)', () => {
		it('renders <footer class="ds-datatable-footer"> when totalCount > 0', () => {
			const result = { items: rows, page: 0, size: 20, totalCount: 2, totalPages: 1 };
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelector('footer.ds-datatable-footer')).not.toBeNull();
		});

		it('does NOT render the footer when totalCount === 0', () => {
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelector('footer.ds-datatable-footer')).toBeNull();
		});

		it('renders Pagination as a child of the footer', () => {
			const result = { items: rows, page: 0, size: 20, totalCount: 2, totalPages: 1 };
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			const nav = container.querySelector('footer.ds-datatable-footer nav');
			expect(nav).not.toBeNull();
		});

		describe('summary', () => {
			it('renders the paraglide-formatted summary on the first page', () => {
				const result = { items: rows, page: 0, size: 20, totalCount: 2, totalPages: 1 };
				const { container } = render(ProviderWithDataTable, {
					props: buildFixtureProps({ result })
				});
				const summary = container.querySelector('.ds-datatable-summary');
				expect(summary?.textContent?.trim()).toBe('Showing 1–2 of 2');
			});

			it('renders the summary with the correct 1-based range on page 2 of a full page', () => {
				const fullPageRows = Array.from({ length: 20 }, (_, i) => ({
					id: String(i + 21),
					name: `Row ${i + 21}`
				}));
				const result = {
					items: fullPageRows,
					page: 1,
					size: 20,
					totalCount: 50,
					totalPages: 3
				};
				const { container } = render(ProviderWithDataTable, {
					props: buildFixtureProps({ result })
				});
				const summary = container.querySelector('.ds-datatable-summary');
				expect(summary?.textContent?.trim()).toBe('Showing 21–40 of 50');
			});

			it('clamps `end` to totalCount on a partial last page', () => {
				const partialPageRows = Array.from({ length: 10 }, (_, i) => ({
					id: String(i + 41),
					name: `Row ${i + 41}`
				}));
				const result = {
					items: partialPageRows,
					page: 2,
					size: 20,
					totalCount: 50,
					totalPages: 3
				};
				const { container } = render(ProviderWithDataTable, {
					props: buildFixtureProps({ result })
				});
				const summary = container.querySelector('.ds-datatable-summary');
				expect(summary?.textContent?.trim()).toBe('Showing 41–50 of 50');
			});

			it('hides the summary when isOutOfRange (page beyond totalPages)', () => {
				const result = {
					items: [],
					page: 999,
					size: 20,
					totalCount: 50,
					totalPages: 3
				};
				const { container } = render(ProviderWithDataTable, {
					props: buildFixtureProps({ result })
				});
				expect(container.querySelector('.ds-datatable-summary')).toBeNull();
				expect(container.querySelector('footer.ds-datatable-footer nav')).not.toBeNull();
			});
		});
	});

	describe('layout structure', () => {
		it('renders core/Table.svelte’s .ds-table-wrapper directly (single scroll context, no extra wrapper)', () => {
			// Reuse core's .ds-table-wrapper as the scroll container so sticky <th> resolves against it.
			const result = { items: rows, page: 0, size: 20, totalCount: 2, totalPages: 1 };
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelectorAll('.ds-table-wrapper').length).toBe(1);
			expect(container.querySelector('.ds-table-wrapper-scroll')).toBeNull();
		});
	});

	describe('loading source', () => {
		it('uses navigating.to !== null as default loading source', () => {
			mocks.setNavigatingTarget({ url: new URL('https://example.test/users?page=2') });
			const result = {
				items: rows,
				page: 0,
				size: 20,
				totalCount: 2,
				totalPages: 1
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
		});

		it('does NOT set aria-busy when navigating.to === null and no loading prop', () => {
			mocks.setNavigatingTarget(null);
			const result = {
				items: rows,
				page: 0,
				size: 20,
				totalCount: 2,
				totalPages: 1
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			expect(container.querySelector('table')?.getAttribute('aria-busy')).toBe('false');
		});

		it('loading prop overrides navigating', () => {
			mocks.setNavigatingTarget(null);
			const result = {
				items: rows,
				page: 0,
				size: 20,
				totalCount: 2,
				totalPages: 1
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result, loading: true })
			});
			expect(container.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
		});

		it('Pagination is disabled when loading', () => {
			mocks.setNavigatingTarget({ url: new URL('https://example.test/?page=2') });
			const result = {
				items: rows,
				page: 0,
				size: 20,
				totalCount: 2,
				totalPages: 1
			};
			const { container } = render(ProviderWithDataTable, {
				props: buildFixtureProps({ result })
			});
			const navButtons = container.querySelectorAll('nav button');
			for (const btn of navButtons) {
				expect((btn as HTMLButtonElement).disabled).toBe(true);
			}
		});
	});

	describe('query preservation on navigation', () => {
		const sortableColumns = [
			{ id: 'name', header: 'Name', accessor: (r: Row) => r.name, sortable: true }
		];

		it('preserves search params and sort when paginating (only page changes)', async () => {
			const filterBinding = createListBinding({ searchParams: { status: 'string' } });
			mocks.setUrl(new URL('https://example.test/users?status=active&sort=name,asc'));
			const query = filterBinding.parse(mocks.readUrl());
			const result = { items: rows, page: 0, size: 20, totalCount: 50, totalPages: 3 };
			const { container } = render(ProviderWithDataTable, {
				// `as never`: a searchParams-typed binding doesn't unify with the
				// fixture's default Record<string, never> generic under
				// testing-library's render typing (same pattern as the direct
				// DataTable render in 'ListProvider scope' above).
				props: { ...buildFixtureProps({ result }), binding: filterBinding, query } as never
			});
			const page2 = container.querySelector('nav button[aria-label="Go to page 2"]');
			await fireEvent.click(page2!);
			expect(mocks.goto).toHaveBeenCalledOnce();
			const url = mocks.goto.mock.calls[0][0] as URL;
			expect(url.searchParams.get('status')).toBe('active');
			expect(url.searchParams.getAll('sort')).toEqual(['name,asc']);
			expect(url.searchParams.get('page')).toBe('1');
		});

		it('preserves filters and resets page to 0 when sorting', async () => {
			const filterBinding = createListBinding({ searchParams: { status: 'string' } });
			mocks.setUrl(new URL('https://example.test/users?status=active&page=2'));
			const query = filterBinding.parse(mocks.readUrl());
			const result = { items: rows, page: 2, size: 20, totalCount: 50, totalPages: 3 };
			const { container } = render(ProviderWithDataTable, {
				props: {
					...buildFixtureProps({ result }),
					binding: filterBinding,
					query,
					columns: sortableColumns
				} as never
			});
			const sortButton = container.querySelector('thead th button');
			await fireEvent.click(sortButton!);
			expect(mocks.goto).toHaveBeenCalledOnce();
			const url = mocks.goto.mock.calls[0][0] as URL;
			expect(url.searchParams.get('status')).toBe('active');
			expect(url.searchParams.has('page')).toBe(false);
			expect(url.searchParams.getAll('sort')).toEqual(['name,asc']);
		});
	});
});
