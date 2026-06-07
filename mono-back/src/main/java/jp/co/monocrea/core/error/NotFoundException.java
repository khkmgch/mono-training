package jp.co.monocrea.core.error;

import java.util.UUID;

public class NotFoundException extends AppException {

    public NotFoundException(String entityName, UUID id) {
        super(entityName + " not found: " + id);
    }

    @Override
    public int status() {
        return 404;
    }

    @Override
    public String type() {
        return "urn:problem:not-found";
    }
}
