package jp.co.monocrea.feature.user.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import jp.co.monocrea.core.error.NotFoundException;
import jp.co.monocrea.core.error.VersionConflictException;
import jp.co.monocrea.core.page.PageRequest;
import jp.co.monocrea.core.page.PageResponse;
import jp.co.monocrea.feature.user.entity.User;
import org.junit.jupiter.api.Test;

@QuarkusTest
class UserRepositoryTest {

    private static final int SEED_USER_COUNT = 12;

    @Inject
    UserRepository repository;

    @Inject
    EntityManager entityManager;

    @Test
    @TestTransaction
    void updateAppliesMutatorAndIncrementsVersion() {
        User user = createUser("rt-upd", "Old Name");
        entityManager.flush();

        User updated = repository.update(user.getId(), user.getVersion(), u -> u.setFullName("New Name"));

        assertEquals("New Name", updated.getFullName());
        assertEquals(1, updated.getVersion());

        flushAndClear();
        User reloaded = repository.getByIdOrThrow(user.getId());
        assertEquals("New Name", reloaded.getFullName());
        assertEquals(1, reloaded.getVersion());
    }

    @Test
    @TestTransaction
    void updateThrowsNotFoundForUnknownId() {
        assertThrows(NotFoundException.class,
                () -> repository.update(UUID.randomUUID(), 0, u -> u.setFullName("x")));
    }

    @Test
    @TestTransaction
    void updateThrowsVersionConflictForStaleVersion() {
        User user = createUser("rt-ver", "Name");
        entityManager.flush();

        assertThrows(VersionConflictException.class,
                () -> repository.update(user.getId(), user.getVersion() + 99, u -> u.setFullName("x")));
    }

    @Test
    @TestTransaction
    void updateThrowsNotFoundForSoftDeletedRow() {
        User user = createUser("rt-upd-del", "Name");
        entityManager.flush();
        repository.delete(user.getId(), user.getVersion());
        flushAndClear();

        assertThrows(NotFoundException.class,
                () -> repository.update(user.getId(), 1, u -> u.setFullName("x")));
    }

    @Test
    @TestTransaction
    void deleteMarksRowDeletedButKeepsItPhysically() {
        User user = createUser("rt-del", "Del Target");
        entityManager.flush();
        UUID id = user.getId();

        repository.delete(id, user.getVersion());
        flushAndClear();

        assertThrows(NotFoundException.class, () -> repository.getByIdOrThrow(id));
        assertEquals(1L, countRows(id, "and deleted_at is not null and version = 1"),
                "row stays physically with deleted_at set and the version bumped");
    }

    @Test
    @TestTransaction
    void deleteThrowsNotFoundForUnknownId() {
        assertThrows(NotFoundException.class, () -> repository.delete(UUID.randomUUID(), 0));
    }

    @Test
    @TestTransaction
    void deleteThrowsVersionConflictForStaleVersion() {
        User user = createUser("rt-del-ver", "Name");
        entityManager.flush();

        assertThrows(VersionConflictException.class,
                () -> repository.delete(user.getId(), user.getVersion() + 99));
    }

    @Test
    @TestTransaction
    void deletingAnAlreadyDeletedRowReportsNotFound() {
        User user = createUser("rt-redel", "Name");
        entityManager.flush();
        repository.delete(user.getId(), 0);
        flushAndClear();

        assertThrows(NotFoundException.class, () -> repository.delete(user.getId(), 1));
    }

    @Test
    @TestTransaction
    void pageReturnsSliceWithCeilingTotalPages() {
        for (int i = 0; i < 5; i++) {
            createUser("rt-page-" + i, "Page User " + i);
        }
        entityManager.flush();

        PageResponse<User> firstPage = repository.search(PageRequest.of(0, 2, null), "rt-page-", null);
        assertEquals(2, firstPage.items().size());
        assertEquals(0, firstPage.page());
        assertEquals(2, firstPage.size());
        assertEquals(5, firstPage.totalCount());
        assertEquals(3, firstPage.totalPages());

        PageResponse<User> lastPage = repository.search(PageRequest.of(2, 2, null), "rt-page-", null);
        assertEquals(1, lastPage.items().size());
    }

    @Test
    @TestTransaction
    void pageBeyondRangeReturnsEmptySliceWithStableMetadata() {
        for (int i = 0; i < 3; i++) {
            createUser("rt-oob-" + i, "Oob User " + i);
        }
        entityManager.flush();

        PageResponse<User> page = repository.search(PageRequest.of(10, 2, null), "rt-oob-", null);
        assertTrue(page.items().isEmpty());
        assertEquals(10, page.page());
        assertEquals(3, page.totalCount());
        assertEquals(2, page.totalPages());
    }

    @Test
    @TestTransaction
    void tieBreakKeepsPaginationStableOnNonUniqueSortColumn() {
        createUser("rt-dup-a", "Same Name");
        createUser("rt-dup-b", "Same Name");
        createUser("rt-dup-c", "Same Name");
        entityManager.flush();

        List<String> sortByName = List.of("fullName,asc");
        UUID first = onlyItemId(repository.search(PageRequest.of(0, 1, sortByName), "rt-dup-", null));
        UUID second = onlyItemId(repository.search(PageRequest.of(1, 1, sortByName), "rt-dup-", null));
        UUID third = onlyItemId(repository.search(PageRequest.of(2, 1, sortByName), "rt-dup-", null));

        assertEquals(3, Set.of(first, second, third).size(),
                "the tie-break column yields a gap-free, non-overlapping order across pages");
    }

    @Test
    @TestTransaction
    void sortOutsideAllowlistFallsBackToTieBreakWithoutError() {
        createUser("rt-sortx-a", "A");
        createUser("rt-sortx-b", "B");
        entityManager.flush();

        PageResponse<User> page =
                repository.search(PageRequest.of(0, 10, List.of("password,desc")), "rt-sortx-", null);
        assertEquals(2, page.items().size());
    }

    @Test
    @TestTransaction
    void searchMatchesCaseInsensitivePartial() {
        createUser("rt-CaseUser", "Case Name");
        entityManager.flush();

        assertEquals(1, repository.search(PageRequest.of(0, 10, null), "caseuser", null).totalCount());
        assertEquals(1, repository.search(PageRequest.of(0, 10, null), "CASEUSER", null).totalCount());
        assertEquals(1, repository.search(PageRequest.of(0, 10, null), "rt-case", null).totalCount());
    }

    @Test
    @TestTransaction
    void searchTreatsLikeMetacharactersLiterally() {
        createUser("rt-pct-50%off", "Percent");
        createUser("rt-pct-50xoff", "Plain");
        createUser("rt-und_score", "Underscore");
        createUser("rt-undXscore", "Plain");
        entityManager.flush();

        PageResponse<User> percent = repository.search(PageRequest.of(0, 10, null), "50%", null);
        assertEquals(1, percent.totalCount());
        assertEquals("rt-pct-50%off", percent.items().get(0).getLoginId());

        PageResponse<User> underscore = repository.search(PageRequest.of(0, 10, null), "und_score", null);
        assertEquals(1, underscore.totalCount());
        assertEquals("rt-und_score", underscore.items().get(0).getLoginId());
    }

    @Test
    @TestTransaction
    void searchCombinesBothFieldsWithAnd() {
        createUser("rt-both", "Both Name");
        createUser("rt-other", "Both Name");
        entityManager.flush();

        assertEquals(1, repository.search(PageRequest.of(0, 10, null), "rt-both", "both").totalCount());
        assertEquals(0, repository.search(PageRequest.of(0, 10, null), "rt-both", "nomatch").totalCount());
    }

    @Test
    @TestTransaction
    void searchWithoutFiltersReturnsEveryVisibleRow() {
        assertEquals(SEED_USER_COUNT,
                repository.search(PageRequest.of(0, 200, null), null, null).totalCount());
        assertEquals(SEED_USER_COUNT,
                repository.search(PageRequest.of(0, 200, null), "   ", "").totalCount(),
                "blank filters are treated as no filter");
    }

    private User createUser(String loginId, String fullName) {
        User user = new User();
        user.setLoginId(loginId);
        user.setFullName(fullName);
        repository.persist(user);
        return user;
    }

    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private long countRows(UUID id, String extraPredicate) {
        return ((Number) entityManager
                .createNativeQuery("select count(*) from app.users where id = ?1 " + extraPredicate)
                .setParameter(1, id)
                .getSingleResult()).longValue();
    }

    private static UUID onlyItemId(PageResponse<User> page) {
        assertEquals(1, page.items().size());
        return page.items().get(0).getId();
    }
}
