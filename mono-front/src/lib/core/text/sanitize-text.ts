/**
 * Sanitize free text before any field-specific space handling: apply Unicode
 * NFC normalization (so combined vs precomposed forms compare equal) and strip
 * invisible / control characters that corrupt equality, search, and display.
 * Tab, newline, and regular/full-width spaces are preserved for the caller's
 * space-handling step.
 *
 * @remarks First stage of {@link collapseSpaces} / {@link stripSpaces}.
 */
export function sanitizeText(value: string): string {
	return (
		value
			.normalize('NFC')
			// Strip Unicode format chars: zero-width, BOM, bidi overrides (ZWJ included —
			// integrity over emoji ZWJ sequences).
			.replace(/\p{Cf}/gu, '')
			// C0/C1 control chars, keeping tab / newline / carriage return.
			.replace(/\p{Cc}/gu, (c) => (c === '\t' || c === '\n' || c === '\r' ? c : ''))
	);
}
