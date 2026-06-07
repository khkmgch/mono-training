package jp.co.monocrea.feature.user.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.UUID;
import jp.co.monocrea.core.page.PageRequest;
import jp.co.monocrea.core.page.PageResponse;
import jp.co.monocrea.feature.user.dto.CreateUserRequest;
import jp.co.monocrea.feature.user.dto.UpdateUserRequest;
import jp.co.monocrea.feature.user.dto.UserMapper;
import jp.co.monocrea.feature.user.dto.UserResponse;
import jp.co.monocrea.feature.user.entity.User;
import jp.co.monocrea.feature.user.repository.UserRepository;

@ApplicationScoped
public class UserService {

    @Inject
    UserRepository repository;

    /**
     * Persists a new user. The {@code login_id} unique constraint also covers soft-deleted rows, so a
     * previously deleted login id cannot be re-registered; the violation is surfaced by the flush and
     * mapped to a 409.
     */
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        User user = new User();
        user.setLoginId(request.loginId());
        user.setFullName(request.fullName());
        repository.persistAndFlush(user);
        return UserMapper.toResponse(user);
    }

    public PageResponse<UserResponse> list(PageRequest page, String loginId, String fullName) {
        return repository.search(page, loginId, fullName).map(UserMapper::toResponse);
    }

    public UserResponse get(UUID id) {
        return UserMapper.toResponse(repository.getByIdOrThrow(id));
    }

    /** Updates a user; a stale {@code version} raises an optimistic-lock conflict. */
    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {
        User updated = repository.update(id, request.version(), user -> {
            user.setLoginId(request.loginId());
            user.setFullName(request.fullName());
        });
        return UserMapper.toResponse(updated);
    }

    /** Soft-deletes a user (the row is kept and marked); a stale {@code version} raises a conflict. */
    @Transactional
    public void delete(UUID id, int version) {
        repository.delete(id, version);
    }
}
