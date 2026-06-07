package jp.co.monocrea.feature.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank @Size(max = 64) String loginId,
        @NotBlank @Size(max = 100) String fullName) {}
