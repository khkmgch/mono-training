package jp.co.monocrea.core.page;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.quarkus.panache.common.Sort;
import java.util.List;
import org.junit.jupiter.api.Test;

class SortWhitelistTest {

    private static final SortWhitelist WHITELIST =
            SortWhitelist.of("loginId", "fullName", "updatedAt");
    private static final Sort TIE_BREAK = Sort.by("id");

    @Test
    void appendsOnlyTieBreakWhenNothingRequested() {
        Sort sort = WHITELIST.toSort(List.of(), TIE_BREAK);
        assertColumns(sort, List.of("id"), List.of(Sort.Direction.Ascending));
    }

    @Test
    void keepsAllowedTermsThenAppendsTieBreak() {
        Sort sort = WHITELIST.toSort(
                List.of(new SortState("loginId", SortDirection.DESC),
                        new SortState("fullName", SortDirection.ASC)),
                TIE_BREAK);
        assertColumns(sort,
                List.of("loginId", "fullName", "id"),
                List.of(Sort.Direction.Descending, Sort.Direction.Ascending, Sort.Direction.Ascending));
    }

    @Test
    void dropsTermsOutsideAllowlist() {
        Sort sort = WHITELIST.toSort(
                List.of(new SortState("password", SortDirection.ASC),
                        new SortState("loginId", SortDirection.ASC)),
                TIE_BREAK);
        assertColumns(sort, List.of("loginId", "id"),
                List.of(Sort.Direction.Ascending, Sort.Direction.Ascending));
    }

    @Test
    void ignoresDuplicateRequestedField() {
        Sort sort = WHITELIST.toSort(
                List.of(new SortState("loginId", SortDirection.ASC),
                        new SortState("loginId", SortDirection.DESC)),
                TIE_BREAK);
        assertColumns(sort, List.of("loginId", "id"),
                List.of(Sort.Direction.Ascending, Sort.Direction.Ascending));
    }

    @Test
    void doesNotDuplicateTieBreakColumnAlreadyRequested() {
        SortWhitelist whitelist = SortWhitelist.of("id", "loginId");
        Sort sort = whitelist.toSort(
                List.of(new SortState("id", SortDirection.DESC)),
                Sort.by("id"));
        assertColumns(sort, List.of("id"), List.of(Sort.Direction.Descending));
    }

    private static void assertColumns(Sort sort, List<String> names, List<Sort.Direction> directions) {
        assertEquals(names.size(), sort.getColumns().size(), "column count");
        for (int index = 0; index < names.size(); index++) {
            Sort.Column column = sort.getColumns().get(index);
            assertEquals(names.get(index), column.getName(), "column[" + index + "] name");
            assertEquals(directions.get(index), column.getDirection(), "column[" + index + "] direction");
        }
    }
}
