import { sanitizeText } from './sanitize-text';

/**
 * Remove every whitespace character (half-width, full-width U+3000, tabs,
 * newlines) after {@link sanitizeText} (NFC + invisible/control-char removal).
 * Canonicalizes identifiers that must not contain spaces, so that `' a b '` and
 * `'ab'` collapse to the same value.
 */
export function stripSpaces(value: string): string {
	return sanitizeText(value).replace(/\s+/g, '');
}
