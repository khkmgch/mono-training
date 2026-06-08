package jp.co.monocrea.core.page;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;

class PageResponseTest {

    @Test
    void computesZeroPagesForEmptyResult() {
        assertEquals(0, PageResponse.of(List.of(), 0, 20, 0).totalPages());
    }

    @Test
    void roundsUpPartialLastPage() {
        assertEquals(1, PageResponse.of(List.of(), 0, 20, 12).totalPages());
        assertEquals(2, PageResponse.of(List.of(), 0, 20, 21).totalPages());
        assertEquals(3, PageResponse.of(List.of(), 0, 20, 41).totalPages());
    }

    @Test
    void computesExactPageMultiples() {
        assertEquals(1, PageResponse.of(List.of(), 0, 20, 20).totalPages());
        assertEquals(2, PageResponse.of(List.of(), 0, 20, 40).totalPages());
    }

    @Test
    void echoesRequestedPageMetadata() {
        PageResponse<String> response = PageResponse.of(List.of("a"), 3, 25, 80);
        assertEquals(3, response.page());
        assertEquals(25, response.size());
        assertEquals(80, response.totalCount());
    }

    @Test
    void mapsItemsAndPreservesMetadata() {
        PageResponse<String> mapped =
                PageResponse.of(List.of(1, 2, 3), 1, 10, 25).map(value -> "n" + value);
        assertEquals(List.of("n1", "n2", "n3"), mapped.items());
        assertEquals(1, mapped.page());
        assertEquals(10, mapped.size());
        assertEquals(25, mapped.totalCount());
        assertEquals(3, mapped.totalPages());
    }
}
