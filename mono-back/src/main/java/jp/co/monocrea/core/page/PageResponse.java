package jp.co.monocrea.core.page;

import java.util.List;
import java.util.function.Function;

public record PageResponse<T>(List<T> items, int page, int size, long totalCount, int totalPages) {

    /** Builds a page response, deriving {@code totalPages} as {@code ceil(totalCount / size)}. */
    public static <T> PageResponse<T> of(List<T> items, int page, int size, long totalCount) {
        int totalPages = size <= 0 ? 0 : (int) ((totalCount + size - 1) / size);
        return new PageResponse<>(items, page, size, totalCount, totalPages);
    }

    /** Converts the items to another type (e.g. entity to DTO) while keeping the page metadata. */
    public <R> PageResponse<R> map(Function<? super T, ? extends R> mapper) {
        return new PageResponse<>(
                items.stream().<R>map(mapper).toList(),
                page, size, totalCount, totalPages);
    }
}
