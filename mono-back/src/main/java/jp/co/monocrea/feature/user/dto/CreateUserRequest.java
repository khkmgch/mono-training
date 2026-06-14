package jp.co.monocrea.feature.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jp.co.monocrea.core.text.TextNormalizer;

public record CreateUserRequest(
        @NotBlank @Size(min = 3, max = 64) @Pattern(regexp = "^[A-Za-z0-9._-]+$") String loginId,
        @NotBlank @Size(max = 100) String fullName) {

    // Canonicalize before validation: the compact constructor runs at deserialization, so
    // @NotBlank/@Size/@Pattern see the normalized value (e.g. a full-width-space-only loginId
    // collapses to "" and is rejected).
    public CreateUserRequest {
        loginId = TextNormalizer.stripSpaces(loginId);
        fullName = TextNormalizer.collapseSpaces(fullName);
    }
}
