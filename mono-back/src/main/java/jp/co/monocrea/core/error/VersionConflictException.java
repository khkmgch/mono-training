package jp.co.monocrea.core.error;

import java.util.UUID;

public class VersionConflictException extends AppException {

    public VersionConflictException(String entityName, UUID id) {
        super(entityName + " was modified concurrently: " + id);
    }

    @Override
    public int status() {
        return 409;
    }

    @Override
    public String type() {
        return "urn:problem:conflict-version";
    }
}
