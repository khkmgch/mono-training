package jp.co.monocrea.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import org.hibernate.annotations.SQLRestriction;

/**
 * Adds a soft-delete marker. The inherited {@code @SQLRestriction} removes soft-deleted rows from
 * every query automatically; the marker itself is written only by {@code SoftDeleteRepository}.
 */
@MappedSuperclass
@SQLRestriction("deleted_at is null")
public abstract class SoftDeletableEntity extends BaseEntity {

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public Instant getDeletedAt() {
        return deletedAt;
    }
}
