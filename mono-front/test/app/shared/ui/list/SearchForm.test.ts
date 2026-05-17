import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet, type Snippet } from 'svelte';
import type { SearchControlsContext } from '$lib/app/shared/ui/list';
import type { FixtureSchema } from './fixture/ProviderWithSearchForm.svelte';

const mocks = vi.hoisted(() => {
	let currentUrl = new URL('https://example.test/users');
	let currentBrowser = true;
	return {
		setUrl(u: URL): void {
			currentUrl = u;
		},
		setBrowser(b: boolean): void {
			currentBrowser = b;
		},
		readUrl(): URL {
			return currentUrl;
		},
		readBrowser(): boolean {
			return currentBrowser;
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
			return null;
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

const [{ createListBinding }, { default: SearchForm }, { default: ProviderWithSearchForm }] =
	await Promise.all([
		import('$lib/app/shared/ui/list'),
		import('$lib/app/shared/ui/list/component/SearchForm.svelte'),
		import('./fixture/ProviderWithSearchForm.svelte')
	]);

const baseBinding = createListBinding({ searchParams: { status: 'string' } });

function searchControlsSnippet(html: string): Snippet<[SearchControlsContext<FixtureSchema>]> {
	return createRawSnippet<[SearchControlsContext<FixtureSchema>]>((_arg) => ({
		render: () => html
	}));
}

// createRawSnippet requires a single root element — wrap in a <div> for the test.
const minimalControls = searchControlsSnippet(
	'<div><input name="q" /><input name="status" /><button type="submit">Search</button></div>'
);

beforeEach(() => {
	mocks.setUrl(new URL('https://example.test/users'));
	mocks.setBrowser(true);
	mocks.goto.mockReset();
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('SearchForm', () => {
	describe('ListProvider scope', () => {
		it('throws when rendered outside any <ListProvider>', () => {
			// Generic SearchForm widens to S=SearchParamsSchema when rendered directly via
			// @testing-library/svelte; cast through `never` so the type checker stays out
			// of the way. We only assert the runtime throw.
			expect(() =>
				render(SearchForm, {
					props: {
						'aria-label': 'Search',
						searchControls: minimalControls
					} as never
				})
			).toThrow(/within a <ListProvider>/);
		});
	});

	describe('landmark element', () => {
		it('renders <search> by default', () => {
			const query = baseBinding.parse(new URL('https://example.test/'));
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			const { container } = render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					'aria-label': 'User search',
					searchControls: minimalControls
				}
			});
			expect(container.querySelector('search')).not.toBeNull();
			expect(container.querySelector('search')?.getAttribute('aria-label')).toBe('User search');
		});

		it('renders <div role="search"> when searchElement="div"', () => {
			const query = baseBinding.parse(new URL('https://example.test/'));
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			const { container } = render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					'aria-label': 'User search',
					searchElement: 'div',
					searchControls: minimalControls
				}
			});
			expect(container.querySelector('search')).toBeNull();
			expect(container.querySelector('div[role="search"]')).not.toBeNull();
		});
	});

	describe('aria-label requirements', () => {
		it('logs an error when neither aria-label nor aria-labelledby is provided', () => {
			const query = baseBinding.parse(new URL('https://example.test/'));
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					searchControls: minimalControls
				}
			});
			expect(console.error).toHaveBeenCalledWith(expect.stringContaining('aria-label'));
		});

		it('logs a warning when both aria-label and aria-labelledby are provided', () => {
			const query = baseBinding.parse(new URL('https://example.test/'));
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					'aria-label': 'Search',
					'aria-labelledby': 'h1',
					searchControls: minimalControls
				}
			});
			expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Both'));
		});
	});

	describe('form composition', () => {
		it('renders an inner <form method="GET">', () => {
			const query = baseBinding.parse(new URL('https://example.test/'));
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			const { container } = render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					'aria-label': 'Search',
					searchControls: minimalControls
				}
			});
			const form = container.querySelector('form');
			expect(form).not.toBeNull();
			expect(form?.getAttribute('method')?.toLowerCase()).toBe('get');
		});

		it('renders the consumer searchControls Snippet inside the form', () => {
			const query = baseBinding.parse(new URL('https://example.test/'));
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			const { container } = render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					'aria-label': 'Search',
					searchControls: minimalControls
				}
			});
			const form = container.querySelector('form');
			expect(form?.querySelector('input[name="q"]')).not.toBeNull();
			expect(form?.querySelector('input[name="status"]')).not.toBeNull();
			expect(form?.querySelector('button[type="submit"]')).not.toBeNull();
		});

		it('does NOT auto-append a submit button (the consumer must provide one)', () => {
			const query = baseBinding.parse(new URL('https://example.test/'));
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			const noButton = searchControlsSnippet('<div><input name="q" /></div>');
			const { container } = render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					'aria-label': 'Search',
					searchControls: noButton
				}
			});
			expect(container.querySelector('button[type="submit"]')).toBeNull();
		});
	});

	describe('hidden inputs (resetOnSubmitKeys-driven)', () => {
		it('preserves size / sort / non-owned keys; drops page; lets form fields override q', () => {
			mocks.setUrl(
				new URL(
					'https://example.test/users?page=3&size=50&sort=name,asc&theme=dark&q=foo&status=active'
				)
			);
			const query = baseBinding.parse(mocks.readUrl());
			const result = { items: [], page: 3, size: 50, totalCount: 0, totalPages: 0 };
			const { container } = render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					'aria-label': 'Search',
					searchControls: minimalControls
				}
			});

			const hidden = container.querySelectorAll('input[type="hidden"]');
			const hiddenMap = new Map<string, string[]>();
			hidden.forEach((node) => {
				const i = node as HTMLInputElement;
				const list = hiddenMap.get(i.name) ?? [];
				list.push(i.value);
				hiddenMap.set(i.name, list);
			});

			// Preserved (URL key, not in form fields, not in resetOnSubmitKeys)
			expect(hiddenMap.get('size')).toEqual(['50']);
			expect(hiddenMap.get('sort')).toEqual(['name,asc']);
			expect(hiddenMap.get('theme')).toEqual(['dark']);

			// Dropped (page is in resetOnSubmitKeys default)
			expect(hiddenMap.has('page')).toBe(false);

			// Dropped from hidden (q / status are form fields — the form data overrides)
			expect(hiddenMap.has('q')).toBe(false);
			expect(hiddenMap.has('status')).toBe(false);
		});

		it('preserves repeat-key values (e.g. sort=name,asc&sort=age,desc) via getAll', () => {
			mocks.setUrl(new URL('https://example.test/?sort=name,asc&sort=age,desc'));
			const query = baseBinding.parse(mocks.readUrl());
			const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };
			const { container } = render(ProviderWithSearchForm, {
				props: {
					binding: baseBinding,
					query,
					result,
					'aria-label': 'Search',
					searchControls: minimalControls
				}
			});

			const sortHidden = Array.from(container.querySelectorAll('input[type="hidden"]'))
				.filter((n) => (n as HTMLInputElement).name === 'sort')
				.map((n) => (n as HTMLInputElement).value);

			expect(sortHidden).toEqual(['name,asc', 'age,desc']);
		});

		it('drops sort too when resetOnSubmitKeys includes "sort"', () => {
			const sortResettingBinding = createListBinding({
				searchParams: { status: 'string' },
				resetOnSubmit: ['page', 'sort']
			});
			mocks.setUrl(new URL('https://example.test/?page=3&sort=name,asc&size=50'));
			const query = sortResettingBinding.parse(mocks.readUrl());
			const result = { items: [], page: 3, size: 50, totalCount: 0, totalPages: 0 };
			const { container } = render(ProviderWithSearchForm, {
				props: {
					binding: sortResettingBinding,
					query,
					result,
					'aria-label': 'Search',
					searchControls: minimalControls
				}
			});

			const hidden = Array.from(container.querySelectorAll('input[type="hidden"]')).map(
				(n) => (n as HTMLInputElement).name
			);
			expect(hidden).not.toContain('page');
			expect(hidden).not.toContain('sort');
			expect(hidden).toContain('size');
		});
	});
});
