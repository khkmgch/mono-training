package jp.co.monocrea.feature.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jp.co.monocrea.core.text.TextNormalizer;

public record UpdateUserRequest(
        @NotBlank @Size(min = 3, max = 64) @Pattern(regexp = "^[A-Za-z0-9._-]+$") String loginId,
        @NotBlank @Size(max = 100) String fullName,
        @NotNull Integer version) {

    // Canonicalize before validation; see CreateUserRequest.
    public UpdateUserRequest {
        loginId = TextNormalizer.stripSpaces(loginId);
        fullName = TextNormalizer.collapseSpaces(fullName);
    }
}
