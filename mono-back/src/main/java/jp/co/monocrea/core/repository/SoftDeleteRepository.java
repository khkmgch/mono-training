package jp.co.monocrea.core.repository;

import jp.co.monocrea.core.entity.SoftDeletableEntity;

import java.time.Instant;
import java.util.UUID;

public abstract class SoftDeleteRepository<T extends SoftDeletableEntity> extends BaseRepository<T> {

    /**
     * Soft-deletes the row matching both id and version by stamping {@code deleted_at} and bumping
     * the version in a single statement. The {@code deleted_at is null} guard makes a repeated delete
     * a no-op instead of reviving the row.
     *
     * @throws jp.co.monocrea.core.error.NotFoundException        when no row has the given id
     * @throws jp.co.monocrea.core.error.VersionConflictException when the row exists but the version does not match
     */
    @Override
    public void delete(UUID id, int expectedVersion) {
        int affected = update(
                "deletedAt = ?1, updatedAt = ?1, version = version + 1 "
                        + "where id = ?2 and version = ?3 and deletedAt is null",
                Instant.now(), id, expectedVersion);
        if (affected == 0) {
            raiseNotFoundOrConflict(id);
        }
    }
}
