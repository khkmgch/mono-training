import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';

const [{ createListBinding }, { default: ProviderContextProbe }] = await Promise.all([
	import('$lib/app/shared/ui/list'),
	import('./fixture/ProviderContextProbe.svelte')
]);

// Fixture uses the schema `{ status: 'string' }` — every test creates a binding
// of that exact shape so generic inference stays deterministic under render().
const newBinding = () => createListBinding({ searchParams: { status: 'string' } });

describe('ListProvider', () => {
	it('renders its children Snippet and adds no wrapping DOM of its own', () => {
		const binding = newBinding();
		const query = binding.parse(new URL('https://x.test/'));
		const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };

		const { container } = render(ProviderContextProbe, {
			props: { binding, query, result }
		});

		// The probe child renders a single <span data-testid="probe-root">; ListProvider
		// itself must not introduce a wrapping element.
		const root = container.firstElementChild as HTMLElement | null;
		expect(root).not.toBeNull();
		expect(root?.tagName.toLowerCase()).toBe('span');
		expect(root?.dataset.testid).toBe('probe-root');
	});

	it('exposes binding / query / result via getListContext from a child', () => {
		const binding = newBinding();
		const query = binding.parse(new URL('https://x.test/?q=alice&status=active'));
		const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };

		const { getByTestId } = render(ProviderContextProbe, {
			props: { binding, query, result }
		});

		expect(getByTestId('probe-q').textContent).toBe('alice');
		expect(getByTestId('probe-status').textContent).toBe('active');
		expect(getByTestId('probe-totalCount').textContent).toBe('0');
	});

	// Note: the `getListContext()` throw is exercised end-to-end via the
	// "DataTable throws when rendered outside any <ListProvider>" and
	// "SearchForm throws when rendered outside any <ListProvider>" tests.
	// Calling `getListContext()` directly from the test body would hit Svelte's
	// `lifecycle_outside_component` guard before our message could surface.

	it('coexists with another ListProvider without leaking the inner context outwards', () => {
		// Render two providers in sequence — each is a separate component tree, so the
		// second render's context does not see the first's. This is implicit in Svelte's
		// per-component context API but worth pinning.
		const binding = newBinding();
		const query = binding.parse(new URL('https://x.test/?q=first'));
		const result = { items: [], page: 0, size: 20, totalCount: 0, totalPages: 0 };

		const { getByTestId, unmount } = render(ProviderContextProbe, {
			props: { binding, query, result }
		});
		expect(getByTestId('probe-q').textContent).toBe('first');
		unmount();

		const query2 = binding.parse(new URL('https://x.test/?q=second'));
		const { getByTestId: getByTestId2 } = render(ProviderContextProbe, {
			props: { binding, query: query2, result }
		});
		expect(getByTestId2('probe-q').textContent).toBe('second');
	});
});

// Note: ListProvider does NOT mock $app/* — it depends only on `setContext`.
// The fixture component below reads via getListContext (no goto/url access).
