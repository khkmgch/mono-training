package jp.co.monocrea.core.page;

import io.quarkus.panache.common.Sort;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Allowlist of sortable fields. Requested terms outside the allowlist are dropped, which both
 * mirrors the frontend's tolerant behavior and blocks {@code ORDER BY} injection (only known
 * field names ever reach the query).
 */
public final class SortWhitelist {

    private final Set<String> allowed;

    private SortWhitelist(Set<String> allowed) {
        this.allowed = allowed;
    }

    public static SortWhitelist of(String... fields) {
        return new SortWhitelist(Set.of(fields));
    }

    /**
     * Translates the allowlisted requested terms into a Panache {@link Sort}, then always appends
     * the tie-break columns so the ordering is total. A total order keeps offset pagination stable
     * (no rows skipped or repeated across page boundaries) even when the user sorts by a non-unique
     * column. A column already present is never appended twice.
     */
    public Sort toSort(List<SortState> requested, Sort tieBreak) {
        Sort sort = Sort.empty();
        Set<String> appended = new HashSet<>();
        for (SortState term : requested) {
            if (allowed.contains(term.field()) && appended.add(term.field())) {
                sort = sort.and(term.field(), toDirection(term.direction()));
            }
        }
        for (Sort.Column column : tieBreak.getColumns()) {
            if (appended.add(column.getName())) {
                sort = sort.and(column.getName(), column.getDirection());
            }
        }
        return sort;
    }

    private static Sort.Direction toDirection(SortDirection direction) {
        return direction == SortDirection.DESC ? Sort.Direction.Descending : Sort.Direction.Ascending;
    }
}
