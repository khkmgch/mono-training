package jp.co.monocrea.core.error;

import com.fasterxml.jackson.annotation.JsonInclude;

/** One field-level error, matching the frontend's {@code {name, message, code?}} shape. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FieldErrorEntry(String name, String message, String code) {}
