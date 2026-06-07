package jp.co.monocrea.core.page;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class SortStateTest {

    @Test
    void parsesFieldAndAscendingDirection() {
        SortState state = SortState.parse("loginId,asc").orElseThrow();
        assertEquals("loginId", state.field());
        assertEquals(SortDirection.ASC, state.direction());
    }

    @Test
    void parsesDescendingDirection() {
        assertEquals(SortDirection.DESC, SortState.parse("loginId,desc").orElseThrow().direction());
    }

    @Test
    void parsesDirectionCaseInsensitively() {
        assertEquals(SortDirection.DESC, SortState.parse("loginId,DESC").orElseThrow().direction());
        assertEquals(SortDirection.ASC, SortState.parse("loginId,Asc").orElseThrow().direction());
    }

    @Test
    void defaultsToAscendingWhenDirectionOmitted() {
        SortState state = SortState.parse("loginId").orElseThrow();
        assertEquals("loginId", state.field());
        assertEquals(SortDirection.ASC, state.direction());
    }

    @Test
    void treatsTrailingCommaAsAscending() {
        assertEquals(SortDirection.ASC, SortState.parse("loginId,").orElseThrow().direction());
    }

    @Test
    void trimsSurroundingWhitespace() {
        SortState state = SortState.parse("  loginId , desc ").orElseThrow();
        assertEquals("loginId", state.field());
        assertEquals(SortDirection.DESC, state.direction());
    }

    @Test
    void returnsEmptyForNullOrBlank() {
        assertTrue(SortState.parse(null).isEmpty());
        assertTrue(SortState.parse("").isEmpty());
        assertTrue(SortState.parse("   ").isEmpty());
    }

    @Test
    void returnsEmptyWhenFieldMissing() {
        assertTrue(SortState.parse(",asc").isEmpty());
    }

    @Test
    void returnsEmptyForUnknownDirection() {
        assertTrue(SortState.parse("loginId,sideways").isEmpty());
    }

    @Test
    void returnsEmptyForTooManySegments() {
        assertTrue(SortState.parse("a,asc,extra").isEmpty());
    }
}
