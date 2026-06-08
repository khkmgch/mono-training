package jp.co.monocrea.feature.user.config;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.Map;
import jp.co.monocrea.app.exception.UniqueConstraintContribution;
import jp.co.monocrea.core.error.FieldErrorEntry;

@ApplicationScoped
public class UserUniqueConstraints implements UniqueConstraintContribution {

    @Override
    public Map<String, FieldErrorEntry> mappings() {
        return Map.of("uq_users_login_id", new FieldErrorEntry("loginId", "Already in use", "unique"));
    }
}
