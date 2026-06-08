package jp.co.monocrea.app.exception;

import java.util.Map;
import jp.co.monocrea.core.error.FieldErrorEntry;

/**
 * A feature's contribution of DB unique-constraint names to the field error shown when each is
 * violated. Implement and mark {@code @ApplicationScoped} to register; the registry collects them.
 */
public interface UniqueConstraintContribution {

    Map<String, FieldErrorEntry> mappings();
}
