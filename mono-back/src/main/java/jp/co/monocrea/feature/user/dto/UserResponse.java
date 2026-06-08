package jp.co.monocrea.feature.user.dto;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(UUID id, String loginId, String fullName,
                           int version, Instant createdAt, Instant updatedAt) {}
