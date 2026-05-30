import { getLocale } from '$lib/paraglide/runtime';

const DEFAULT_INVALID_FALLBACK = '—';
const DEFAULT_INTL_OPTIONS: Intl.DateTimeFormatOptions = {
	dateStyle: 'medium',
	timeStyle: 'short'
};

export type FormatDateTimeOptions = {
	/**
	 * Pass-through to `Intl.DateTimeFormatOptions`. Defaults to
	 * `{ dateStyle: 'medium', timeStyle: 'short' }`. Override to omit the
	 * time portion (`{ dateStyle: 'medium' }`), switch to long format, etc.
	 * `timeZone` and other Intl knobs flow through here — they are not given
	 * dedicated parameters until a concrete call site needs them.
	 */
	intl?: Intl.DateTimeFormatOptions;
	/**
	 * Override the active paraglide locale. Use for tests or admin contexts
	 * where a specific locale must apply regardless of user preference.
	 * Defaults to the resolved paraglide locale.
	 */
	locale?: string;
	/**
	 * Rendered when `raw` is missing, empty, or not a valid ISO 8601
	 * timestamp. Defaults to an em dash (`—`); pass `''` to render blank.
	 */
	invalidFallback?: string;
};

/**
 * Format an ISO 8601 datetime string via `Intl.DateTimeFormat` bound to the
 * resolved paraglide locale.
 */
export function formatDateTime(raw: string, options?: FormatDateTimeOptions): string {
	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) {
		return options?.invalidFallback ?? DEFAULT_INVALID_FALLBACK;
	}
	return new Intl.DateTimeFormat(
		options?.locale ?? getLocale(),
		options?.intl ?? DEFAULT_INTL_OPTIONS
	).format(date);
}
