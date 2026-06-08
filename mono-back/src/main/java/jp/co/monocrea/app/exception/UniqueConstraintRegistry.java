package jp.co.monocrea.app.exception;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import jp.co.monocrea.core.error.FieldErrorEntry;

@ApplicationScoped
public class UniqueConstraintRegistry {

    @Inject
    Instance<UniqueConstraintContribution> contributions;

    private final Map<String, FieldErrorEntry> byConstraintName = new HashMap<>();

    @PostConstruct
    void aggregate() {
        for (UniqueConstraintContribution contribution : contributions) {
            byConstraintName.putAll(contribution.mappings());
        }
    }

    /**
     * Resolves a violated constraint name to its field error.
     *
     * @return a single-entry list, or an empty list when the name is unknown or unreported by the
     *         dialect, so the caller falls back to a generic conflict response with no errors array
     */
    public List<FieldErrorEntry> resolve(String constraintName) {
        if (constraintName == null) {
            return List.of();
        }
        FieldErrorEntry entry = byConstraintName.get(constraintName);
        return entry == null ? List.of() : List.of(entry);
    }
}
