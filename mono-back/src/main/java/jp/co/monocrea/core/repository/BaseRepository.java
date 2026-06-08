package jp.co.monocrea.core.repository;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;

import java.lang.reflect.ParameterizedType;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;

import jp.co.monocrea.core.entity.BaseEntity;
import jp.co.monocrea.core.error.NotFoundException;
import jp.co.monocrea.core.error.VersionConflictException;
import jp.co.monocrea.core.page.PageRequest;
import jp.co.monocrea.core.page.PageResponse;
import jp.co.monocrea.core.page.SortWhitelist;

/**
 * Base repository adding version-checked CRUD and counted, sorted, paginated queries on top of
 * Panache. Feature repositories declare their sortable fields and build search predicates;
 * optimistic locking, not-found/conflict resolution and page assembly all live here.
 */
public abstract class BaseRepository<T extends BaseEntity> implements PanacheRepositoryBase<T, UUID> {

    /** Fields a client may sort by — an allowlist that also blocks {@code ORDER BY} injection. */
    protected abstract SortWhitelist sortWhitelist();

    /**
     * Trailing sort that forces a total order so offset pagination stays stable across pages.
     * Defaults to {@code id} ascending; override to break ties on another unique column.
     */
    protected Sort tieBreakSort() {
        return Sort.by("id");
    }

    /**
     * Loads an entity by id, throwing when it is missing. A soft-deleted row counts as missing.
     *
     * <p>This deliberately runs a query instead of {@link #findById}: {@code findById} can return a
     * row already held in the persistence context without re-checking {@code @SQLRestriction}, so a
     * row soft-deleted out-of-band within the same transaction could slip through. A query always
     * re-evaluates the restriction at the database.
     *
     * @throws NotFoundException when no visible row has the given id
     */
    public T getByIdOrThrow(UUID id) {
        return find("id = ?1", id).firstResultOptional()
                .orElseThrow(() -> new NotFoundException(entityName(), id));
    }

    /**
     * Applies {@code mutator} to the managed entity after checking the optimistic-lock version, then
     * flushes so a concurrent change surfaces as an {@link jakarta.persistence.OptimisticLockException}
     * here — before commit, where it would otherwise be wrapped and hidden from the mapper.
     *
     * @throws NotFoundException        when the id does not exist or is soft-deleted
     * @throws VersionConflictException when {@code expectedVersion} does not match the stored version
     */
    public T update(UUID id, int expectedVersion, Consumer<T> mutator) {
        T entity = getByIdOrThrow(id);
        if (entity.getVersion() != expectedVersion) {
            throw new VersionConflictException(entityName(), id);
        }
        mutator.accept(entity);
        flush();
        return entity;
    }

    /**
     * Physically deletes the row matching both id and version. {@code SoftDeleteRepository} overrides
     * this to soft-delete instead.
     *
     * @throws NotFoundException        when no row has the given id
     * @throws VersionConflictException when the row exists but the version does not match
     */
    public void delete(UUID id, int expectedVersion) {
        long affected = delete("id = ?1 and version = ?2", id, expectedVersion);
        if (affected == 0) {
            raiseNotFoundOrConflict(id);
        }
    }

    /**
     * Runs a counted, sorted, paginated query. A blank {@code hql} predicate means "all rows", so a
     * feature can pass an empty builder for an unfiltered listing.
     */
    protected PageResponse<T> findPage(PageRequest request, String hql, Map<String, Object> params) {
        Sort sort = sortWhitelist().toSort(request.sort(), tieBreakSort());
        boolean hasPredicate = hql != null && !hql.isBlank();
        PanacheQuery<T> query = hasPredicate ? find(hql, sort, params) : findAll(sort);
        long totalCount = query.count();
        List<T> items = query.page(request.page(), request.size()).list();
        return PageResponse.of(items, request.page(), request.size(), totalCount);
    }

    /** Tells apart the two reasons a versioned write affected no rows: missing id vs. stale version. */
    protected void raiseNotFoundOrConflict(UUID id) {
        if (find("id = ?1", id).firstResultOptional().isPresent()) {
            throw new VersionConflictException(entityName(), id);
        }
        throw new NotFoundException(entityName(), id);
    }

    private String entityName() {
        // Resolve T's simple name from the generic hierarchy so features need not declare it. The walk
        // skips any ArC-generated subclass and any base whose type argument is still a type variable.
        for (Class<?> type = getClass(); type != null; type = type.getSuperclass()) {
            if (type.getGenericSuperclass() instanceof ParameterizedType parameterized
                    && parameterized.getActualTypeArguments()[0] instanceof Class<?> entityType) {
                return entityType.getSimpleName();
            }
        }
        throw new IllegalStateException("Unable to resolve entity type for " + getClass());
    }
}
