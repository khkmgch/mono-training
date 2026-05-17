import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import Pagination from '$lib/core/pagination/Pagination.svelte';
import type { PaginationLabels } from '$lib/core/pagination';

const labels: PaginationLabels = {
	nav: 'Pagination',
	previousPage: 'Previous',
	nextPage: 'Next',
	page: (n: number) => `Go to page ${n}`
};

const baseProps = {
	page: 4,
	totalPages: 10,
	onPageChange: () => {},
	labels
};

function getButtons(container: HTMLElement): HTMLButtonElement[] {
	return Array.from(container.querySelectorAll('button'));
}

function getNumberedButtons(container: HTMLElement): HTMLButtonElement[] {
	return getButtons(container).filter((b) => /^\d+$/.test((b.textContent ?? '').trim()));
}

describe('Pagination', () => {
	describe('basic rendering', () => {
		it('renders a <nav aria-label> from labels.nav', () => {
			const { container } = render(Pagination, { props: baseProps });
			expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
		});

		it('renders previous and next buttons with their visible labels', () => {
			const { container } = render(Pagination, { props: baseProps });
			const buttons = getButtons(container);
			expect(buttons[0].textContent?.trim()).toBe('Previous');
			expect(buttons[buttons.length - 1].textContent?.trim()).toBe('Next');
		});

		it('renders page buttons with 1-based display numbers', () => {
			// page=4, total=10 → window = [0, …, 3, 4, 5, …, 9] → display [1, …, 4, 5, 6, …, 10]
			const { container } = render(Pagination, { props: baseProps });
			const numbers = getNumberedButtons(container).map((b) => (b.textContent ?? '').trim());
			expect(numbers).toEqual(['1', '4', '5', '6', '10']);
		});

		it('marks the current page button with aria-current="page"', () => {
			const { container } = render(Pagination, { props: baseProps });
			const current = container.querySelector('button[aria-current="page"]');
			expect(current?.textContent?.trim()).toBe('5'); // 0-based 4 → display 5
		});

		it('renders ellipsis as <li aria-hidden="true">', () => {
			const { container } = render(Pagination, { props: baseProps });
			const ellipses = container.querySelectorAll('li[aria-hidden="true"]');
			expect(ellipses).toHaveLength(2);
			expect(ellipses[0].textContent).toBe('…');
		});

		it('uses labels.page for SR aria-label on page buttons', () => {
			const { container } = render(Pagination, { props: baseProps });
			const pageBtn = getNumberedButtons(container)[0];
			expect(pageBtn.getAttribute('aria-label')).toBe('Go to page 1');
		});

		it('falls back to default "Go to page N" when labels.page is omitted', () => {
			const minimal: PaginationLabels = {
				nav: 'Pagination',
				previousPage: 'Previous',
				nextPage: 'Next'
			};
			const { container } = render(Pagination, { props: { ...baseProps, labels: minimal } });
			const pageBtn = getNumberedButtons(container)[0];
			expect(pageBtn.getAttribute('aria-label')).toBe('Go to page 1');
		});
	});

	describe('disable rules', () => {
		it('disables prev when page <= 0', () => {
			const { container } = render(Pagination, { props: { ...baseProps, page: 0 } });
			expect(getButtons(container)[0].disabled).toBe(true);
		});

		it('disables next when page >= totalPages - 1', () => {
			const { container } = render(Pagination, { props: { ...baseProps, page: 9 } });
			const buttons = getButtons(container);
			expect(buttons[buttons.length - 1].disabled).toBe(true);
		});

		it('disables every button when disabled=true', () => {
			const { container } = render(Pagination, { props: { ...baseProps, disabled: true } });
			for (const btn of getButtons(container)) expect(btn.disabled).toBe(true);
		});

		it('keeps page buttons enabled when neither edge nor disabled prop applies', () => {
			const { container } = render(Pagination, { props: baseProps });
			const numbered = getNumberedButtons(container);
			for (const btn of numbered) expect(btn.disabled).toBe(false);
		});
	});

	describe('out-of-range page (echo from backend)', () => {
		it('still renders the last-page window when page >= totalPages', () => {
			// computePageWindow(999, 10) → [0, ellipsis, 7, 8, 9]
			const { container } = render(Pagination, {
				props: { ...baseProps, page: 999, totalPages: 10 }
			});
			const numbers = getNumberedButtons(container).map((b) => (b.textContent ?? '').trim());
			expect(numbers).toEqual(['1', '8', '9', '10']);
		});

		it('does not show a current-page indicator when page is out of range', () => {
			const { container } = render(Pagination, {
				props: { ...baseProps, page: 999, totalPages: 10 }
			});
			expect(container.querySelector('button[aria-current="page"]')).toBeNull();
		});

		it('disables next when page >= totalPages - 1 even out of range', () => {
			const { container } = render(Pagination, {
				props: { ...baseProps, page: 999, totalPages: 10 }
			});
			const buttons = getButtons(container);
			expect(buttons[buttons.length - 1].disabled).toBe(true);
		});
	});

	describe('onPageChange', () => {
		it('passes 0-based page index (no DOM event) when a page button is clicked', async () => {
			const onPageChange = vi.fn();
			const { container } = render(Pagination, { props: { ...baseProps, onPageChange } });
			await fireEvent.click(getNumberedButtons(container)[0]);
			expect(onPageChange).toHaveBeenCalledWith(0); // display 1 → 0-based 0
		});

		it('passes page - 1 when prev is clicked', async () => {
			const onPageChange = vi.fn();
			const { container } = render(Pagination, { props: { ...baseProps, onPageChange } });
			await fireEvent.click(getButtons(container)[0]);
			expect(onPageChange).toHaveBeenCalledWith(3);
		});

		it('passes page + 1 when next is clicked', async () => {
			const onPageChange = vi.fn();
			const { container } = render(Pagination, { props: { ...baseProps, onPageChange } });
			const buttons = getButtons(container);
			await fireEvent.click(buttons[buttons.length - 1]);
			expect(onPageChange).toHaveBeenCalledWith(5);
		});
	});

	describe('totalPages = 0', () => {
		it('renders no numbered buttons when totalPages is 0', () => {
			// DataTable hides Pagination at totalCount === 0; this guards the unit boundary.
			const { container } = render(Pagination, {
				props: { ...baseProps, page: 0, totalPages: 0 }
			});
			expect(getNumberedButtons(container)).toHaveLength(0);
			// prev/next are still rendered and disabled
			const buttons = getButtons(container);
			expect(buttons).toHaveLength(2);
			expect(buttons[0].disabled).toBe(true);
			expect(buttons[1].disabled).toBe(true);
		});
	});
});
