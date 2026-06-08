package jp.co.monocrea.feature.user.dto;

import jp.co.monocrea.feature.user.entity.User;

public final class UserMapper {

    private UserMapper() {}

    public static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getLoginId(), user.getFullName(),
                user.getVersion(), user.getCreatedAt(), user.getUpdatedAt());
    }
}
