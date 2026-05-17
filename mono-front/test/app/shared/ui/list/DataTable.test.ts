import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
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
			// @testing-library/svelte; cast through `never` so the type checker
			// stays out of the way. We only assert the runtime throw.
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
			// The contract: out-of-range UI is the outOfRange Snippet (role="status"),
			// not a toast. Asserted by the absence of any toast indication in DOM.
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
});
