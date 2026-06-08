package jp.co.monocrea.core.page;

import java.util.Optional;

public record SortState(String field, SortDirection direction) {

    /**
     * Parses one sort term such as {@code "loginId,asc"} (direction defaults to ascending when
     * omitted).
     *
     * @return empty when the term is malformed, so callers can drop it silently to match the
     *         frontend's tolerant query handling
     */
    public static Optional<SortState> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String[] segments = raw.split(",", -1);
        if (segments.length > 2) {
            return Optional.empty();
        }
        String field = segments[0].trim();
        if (field.isEmpty()) {
            return Optional.empty();
        }
        String directionToken = segments.length == 2 ? segments[1].trim() : "";
        return parseDirection(directionToken).map(direction -> new SortState(field, direction));
    }

    private static Optional<SortDirection> parseDirection(String token) {
        if (token.isEmpty() || token.equalsIgnoreCase("asc")) {
            return Optional.of(SortDirection.ASC);
        }
        if (token.equalsIgnoreCase("desc")) {
            return Optional.of(SortDirection.DESC);
        }
        return Optional.empty();
    }
}
