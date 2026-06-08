package jp.co.monocrea.core.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/** RFC 9457 {@code application/problem+json} body, with an {@code errors} extension for field errors. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProblemDetail(String type, String title, int status, String detail,
                            @JsonInclude(JsonInclude.Include.NON_EMPTY) List<FieldErrorEntry> errors) {}
