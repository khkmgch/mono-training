package jp.co.monocrea.core.error;

import java.util.List;

/**
 * Base for business exceptions that carry their own HTTP mapping. A single exception mapper reads
 * {@link #status()}, {@link #type()} and {@link #errors()} to build the problem response, so adding
 * a new failure means adding a subclass rather than another mapper branch.
 */
public abstract class AppException extends RuntimeException {

    protected AppException(String message) {
        super(message);
    }

    public abstract int status();

    public abstract String type();

    public List<FieldErrorEntry> errors() {
        return List.of();
    }
}
