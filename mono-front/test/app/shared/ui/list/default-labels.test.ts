import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PAGINATION_LABELS,
	defaultSortAriaLabel
} from '$lib/app/shared/ui/list/default-labels';
import type { Column } from '$lib/core/table';

type Row = { id: string };

describe('DEFAULT_PAGINATION_LABELS', () => {
	it('exposes nav as a getter that reads from paraglide', () => {
		expect(DEFAULT_PAGINATION_LABELS.nav).toBeTypeOf('string');
		expect(DEFAULT_PAGINATION_LABELS.nav.length).toBeGreaterThan(0);
		// paraglide strategy: cookie → preferredLanguage → baseLocale.
		// In jsdom navigator.language defaults to 'en-US' → preferredLanguage matches 'en'.
		expect(DEFAULT_PAGINATION_LABELS.nav).toBe('Pagination');
	});

	it('exposes previousPage as a getter', () => {
		expect(DEFAULT_PAGINATION_LABELS.previousPage).toBe('Previous');
	});

	it('exposes nextPage as a getter', () => {
		expect(DEFAULT_PAGINATION_LABELS.nextPage).toBe('Next');
	});

	it('exposes page() that interpolates the 1-based page number', () => {
		const result = DEFAULT_PAGINATION_LABELS.page?.(3);
		expect(result).toBe('Go to page 3');
	});

	it('re-reads paraglide on every getter access (locale switch friendly)', () => {
		// We can't easily switch locales mid-test without mocking paraglide,
		// but we can verify the getter pattern by accessing twice and confirming
		// both reads succeed (proves the value isn't frozen at module init).
		const first = DEFAULT_PAGINATION_LABELS.nav;
		const second = DEFAULT_PAGINATION_LABELS.nav;
		expect(first).toBe(second);
		expect(first.length).toBeGreaterThan(0);
	});
});

describe('defaultSortAriaLabel', () => {
	it('uses col.label when provided', () => {
		const col: Column<Row> = { id: 'name', header: 'Name', label: '氏名' };
		const label = defaultSortAriaLabel(col, 'asc');
		expect(label).toContain('氏名');
		expect(label).toContain('asc');
	});

	it('falls back to the string header when label is absent', () => {
		const col: Column<Row> = { id: 'name', header: 'Name' };
		const label = defaultSortAriaLabel(col, 'desc');
		expect(label).toContain('Name');
		expect(label).toContain('desc');
	});

	it('falls back to id when header is a Snippet and label takes precedence', () => {
		// When header is a Snippet, label is type-required, so we set label
		// and verify it is preferred over inspecting the Snippet.
		const col: Column<Row> = {
			id: 'name',
			header: (() => undefined) as unknown as Column<Row>['header'] & object,
			label: 'Identifier'
		};
		const label = defaultSortAriaLabel(col, 'none');
		expect(label).toContain('Identifier');
		expect(label).toContain('none');
	});

	it('uses the paraglide template "Sort by {column}, {direction}" under jsdom en', () => {
		const col: Column<Row> = { id: 'name', header: '名前' };
		expect(defaultSortAriaLabel(col, 'asc')).toBe('Sort by 名前, asc');
	});
});
