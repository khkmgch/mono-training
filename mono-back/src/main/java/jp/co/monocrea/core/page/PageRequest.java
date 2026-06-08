package jp.co.monocrea.core.page;

import java.util.List;
import java.util.Optional;

public record PageRequest(int page, int size, List<SortState> sort) {

    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    /**
     * Normalizes raw query parameters instead of rejecting them: {@code page} is floored at 0,
     * {@code size} is clamped to {@code [1, MAX_SIZE]} (falling back to {@link #DEFAULT_SIZE} when
     * below 1), and each malformed sort term is dropped. This mirrors the frontend's tolerant
     * handling and prevents oversized pages.
     */
    public static PageRequest of(int page, int size, List<String> rawSort) {
        int normalizedPage = Math.max(0, page);
        int normalizedSize = size < 1 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        List<SortState> sort = rawSort == null
                ? List.of()
                : rawSort.stream().map(SortState::parse).flatMap(Optional::stream).toList();
        return new PageRequest(normalizedPage, normalizedSize, sort);
    }
}
