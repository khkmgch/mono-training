package jp.co.monocrea.core.text;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class TextNormalizerTest {

    @ParameterizedTest
    @MethodSource("collapseCases")
    void collapseSpaces(String input, String expected) {
        assertEquals(expected, TextNormalizer.collapseSpaces(input));
    }

    static Stream<Arguments> collapseCases() {
        return Stream.of(
                Arguments.of("  Tanaka Kenji  ", "Tanaka Kenji"), // trims half-width ends
                Arguments.of("　　Tanaka Kenji　　", "Tanaka Kenji"), // trims full-width ends
                Arguments.of("Tanaka   Kenji", "Tanaka Kenji"), // collapses runs
                Arguments.of("Tanaka　Kenji", "Tanaka Kenji"), // full-width separator → half-width
                Arguments.of("Tanaka 　 Kenji", "Tanaka Kenji"), // mixed widths
                Arguments.of("Tanaka\t\nKenji", "Tanaka Kenji"), // tabs / newlines
                Arguments.of("Tanaka Kenji", "Tanaka Kenji"), // already canonical
                Arguments.of("", ""),
                Arguments.of("   ", ""), // half-width only
                Arguments.of("　　", ""), // full-width only
                Arguments.of(Character.toString(0x200B) + "Tanaka  Kenji", "Tanaka Kenji")); // sanitize + collapse
    }

    @ParameterizedTest
    @MethodSource("stripCases")
    void stripSpaces(String input, String expected) {
        assertEquals(expected, TextNormalizer.stripSpaces(input));
    }

    static Stream<Arguments> stripCases() {
        return Stream.of(
                Arguments.of("  admin  ", "admin"), // trims ends
                Arguments.of("a b c", "abc"), // internal half-width
                Arguments.of("a　b　c", "abc"), // internal full-width
                Arguments.of("a\tb\nc", "abc"), // tabs / newlines
                Arguments.of("admin01", "admin01"), // no spaces unchanged
                Arguments.of("", ""),
                Arguments.of("  　  ", ""), // spaces only
                Arguments.of("ad" + Character.toString(0x200B) + " min", "admin")); // sanitize + strip
    }

    @ParameterizedTest
    @MethodSource("sanitizeCases")
    void sanitizeText(String input, String expected) {
        assertEquals(expected, TextNormalizer.sanitizeText(input));
    }

    static Stream<Arguments> sanitizeCases() {
        return Stream.of(
                // か(U+304B) + combining dakuten(U+3099) → が(U+304C)
                Arguments.of(Character.toString(0x304B) + Character.toString(0x3099), Character.toString(0x304C)),
                Arguments.of("ad" + Character.toString(0x200B) + "min" + Character.toString(0xFEFF), "admin"),
                Arguments.of("a" + Character.toString(0x202E) + "b" + Character.toString(0x2066) + "c", "abc"),
                Arguments.of("a" + Character.toString(0x01) + "b\tc\nd", "ab\tc\nd")); // keeps tab/newline
    }

    @Test
    void returnsNullForNull() {
        assertNull(TextNormalizer.collapseSpaces(null));
        assertNull(TextNormalizer.stripSpaces(null));
        assertNull(TextNormalizer.sanitizeText(null));
    }

    @Test
    void isIdempotent() {
        String collapsed = TextNormalizer.collapseSpaces("　Tanaka　　Kenji　");
        assertEquals(collapsed, TextNormalizer.collapseSpaces(collapsed));
        String stripped = TextNormalizer.stripSpaces("  a b c  ");
        assertEquals(stripped, TextNormalizer.stripSpaces(stripped));
    }
}
