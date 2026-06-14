import { sanitizeText } from './sanitize-text';

/**
 * Collapse every run of whitespace into a single half-width space and trim the
 * ends, after {@link sanitizeText} (NFC + invisible/control-char removal).
 * Canonicalizes free-text values (e.g. 人名) so that inputs differing only in
 * spacing — a full-width vs half-width separator, doubled spaces, stray tabs —
 * compare and persist as one value.
 *
 * @remarks JavaScript's `\s` already matches the full-width space (U+3000), so a
 *   single `\s` class covers full-width input.
 */
export function collapseSpaces(value: string): string {
	return sanitizeText(value)
		.replace(/\s+/g, ' ')
		.trim();
}
