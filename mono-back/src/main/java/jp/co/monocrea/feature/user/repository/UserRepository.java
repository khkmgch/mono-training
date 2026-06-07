package jp.co.monocrea.feature.user.repository;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.HashMap;
import java.util.Map;

import jp.co.monocrea.core.page.PageRequest;
import jp.co.monocrea.core.page.PageResponse;
import jp.co.monocrea.core.page.SortWhitelist;
import jp.co.monocrea.core.repository.SoftDeleteRepository;
import jp.co.monocrea.feature.user.entity.User;

@ApplicationScoped
public class UserRepository extends SoftDeleteRepository<User> {

    private static final SortWhitelist SORTABLE = SortWhitelist.of("loginId", "fullName", "updatedAt");

    @Override
    protected SortWhitelist sortWhitelist() {
        return SORTABLE;
    }

    /** Lists users filtered by case-insensitive partial matches on {@code loginId} / {@code fullName}. */
    public PageResponse<User> search(PageRequest request, String loginId, String fullName) {
        StringBuilder hql = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        if (isPresent(loginId)) {
            hql.append("lower(loginId) like :loginId escape '\\'");
            params.put("loginId", contains(loginId));
        }
        if (isPresent(fullName)) {
            and(hql).append("lower(fullName) like :fullName escape '\\'");
            params.put("fullName", contains(fullName));
        }
        return findPage(request, hql.toString(), params);
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static StringBuilder and(StringBuilder hql) {
        if (!hql.isEmpty()) {
            hql.append(" and ");
        }
        return hql;
    }

    /** Lower-cases the term and escapes the LIKE metacharacters so it matches literally inside {@code %..%}. */
    private static String contains(String value) {
        String escaped = value.toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
