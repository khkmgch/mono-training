package jp.co.monocrea.core.page;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class PageRequestTest {

    @Test
    void keepsValidPageAndSize() {
        PageRequest request = PageRequest.of(2, 50, null);
        assertEquals(2, request.page());
        assertEquals(50, request.size());
    }

    @Test
    void floorsNegativePageToZero() {
        assertEquals(0, PageRequest.of(-3, 20, null).page());
    }

    @Test
    void defaultsSizeWhenBelowOne() {
        assertEquals(PageRequest.DEFAULT_SIZE, PageRequest.of(0, 0, null).size());
        assertEquals(PageRequest.DEFAULT_SIZE, PageRequest.of(0, -5, null).size());
    }

    @Test
    void clampsSizeToMaximum() {
        assertEquals(PageRequest.MAX_SIZE, PageRequest.of(0, PageRequest.MAX_SIZE + 1, null).size());
        assertEquals(PageRequest.MAX_SIZE, PageRequest.of(0, 9999, null).size());
    }

    @Test
    void keepsSizeAtBoundaries() {
        assertEquals(1, PageRequest.of(0, 1, null).size());
        assertEquals(PageRequest.MAX_SIZE, PageRequest.of(0, PageRequest.MAX_SIZE, null).size());
    }

    @Test
    void parsesAndDropsMalformedSortTerms() {
        PageRequest request = PageRequest.of(0, 20,
                List.of("loginId,asc", "bogus,sideways", "fullName,desc", "  "));
        assertEquals(
                List.of(new SortState("loginId", SortDirection.ASC),
                        new SortState("fullName", SortDirection.DESC)),
                request.sort());
    }

    @Test
    void yieldsEmptySortWhenRawIsNull() {
        assertTrue(PageRequest.of(0, 20, null).sort().isEmpty());
    }
}
