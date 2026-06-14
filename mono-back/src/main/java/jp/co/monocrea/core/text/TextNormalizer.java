package jp.co.monocrea.core.text;

import java.text.Normalizer;

public final class TextNormalizer {

    private TextNormalizer() {}

    /**
     * Sanitizes free text before any space handling: applies Unicode NFC normalization and strips
     * invisible / control characters (zero-width incl. ZWJ, BOM, bidi overrides, C0/C1 controls)
     * that corrupt equality, search, and display. Tab, newline, and carriage return are preserved
     * for the space-handling step.
     *
     * @return {@code null} when {@code value} is {@code null}.
     */
    public static String sanitizeText(String value) {
        if (value == null) {
            return null;
        }
        return Normalizer.normalize(value, Normalizer.Form.NFC)
                .replaceAll("\\p{Cf}", "")
                .replaceAll("[\\p{Cc}&&[^\\t\\n\\r]]", "");
    }

    /**
     * Collapses every run of whitespace into a single half-width space and trims the ends, after
     * {@link #sanitizeText(String)}, so free-text values differing only in spacing (a full-width vs
     * half-width separator, doubled spaces, stray tabs) canonicalize to one form.
     *
     * @return {@code null} when {@code value} is {@code null}, leaving a null/blank request field
     *     for Bean Validation ({@code @NotBlank}) to reject.
     */
    public static String collapseSpaces(String value) {
        if (value == null) {
            return null;
        }
        // Java's \s is ASCII-only and String.strip() (not trim()) removes the full-width space,
        // so U+3000 is matched explicitly and strip() handles the trimmed ends.
        return sanitizeText(value).replaceAll("[\\s\\u3000]+", " ").strip();
    }

    /**
     * Removes every whitespace character, including the full-width space U+3000, after
     * {@link #sanitizeText(String)}, to canonicalize identifiers that must not contain spaces.
     *
     * @return {@code null} when {@code value} is {@code null}; see {@link #collapseSpaces(String)}.
     */
    public static String stripSpaces(String value) {
        if (value == null) {
            return null;
        }
        return sanitizeText(value).replaceAll("[\\s\\u3000]+", "");
    }
}
