import { describe, expect, it, vi } from 'vitest';

// Lock the paraglide locale so format assertions are stable across CI / dev machines.
vi.mock('$lib/paraglide/runtime', () => ({
	getLocale: () => 'en-US'
}));

const { formatDateTime } = await import('$lib/app/shared/format');

describe('formatDateTime', () => {
	const iso = '2026-04-10T12:00:00Z';

	it('formats with medium date + short time defaults', () => {
		const out = formatDateTime(iso);
		// `Intl.DateTimeFormat` output varies subtly across Node versions, so
		// assert by recomputing the expected value with the same options.
		const expected = new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(iso));
		expect(out).toBe(expected);
	});

	it('returns em-dash for invalid input by default', () => {
		expect(formatDateTime('')).toBe('—');
		expect(formatDateTime('not-a-date')).toBe('—');
		expect(formatDateTime(undefined as unknown as string)).toBe('—');
	});

	it('honors a custom invalidFallback (including empty string for blank cells)', () => {
		expect(formatDateTime('', { invalidFallback: 'N/A' })).toBe('N/A');
		expect(formatDateTime('garbage', { invalidFallback: '' })).toBe('');
	});

	it('respects an Intl options override (date only)', () => {
		const out = formatDateTime(iso, { intl: { dateStyle: 'medium' } });
		const expected = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
			new Date(iso)
		);
		expect(out).toBe(expected);
		expect(out).not.toMatch(/\d{1,2}:\d{2}/);
	});

	it('respects a locale override', () => {
		const out = formatDateTime(iso, { locale: 'ja-JP' });
		const expected = new Intl.DateTimeFormat('ja-JP', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(iso));
		expect(out).toBe(expected);
	});

	it('forwards arbitrary Intl options (timeZone) without a dedicated parameter', () => {
		const out = formatDateTime(iso, {
			intl: { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }
		});
		const expected = new Intl.DateTimeFormat('en-US', {
			dateStyle: 'short',
			timeStyle: 'short',
			timeZone: 'UTC'
		}).format(new Date(iso));
		expect(out).toBe(expected);
	});
});
