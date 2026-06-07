package jp.co.monocrea.app.exception;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.OptimisticLockException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.util.List;
import jp.co.monocrea.core.error.AppException;
import jp.co.monocrea.core.error.FieldErrorEntry;
import jp.co.monocrea.core.error.ProblemDetail;
import org.hibernate.exception.ConstraintViolationException.ConstraintKind;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestResponse;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;

/**
 * Translates every error into an {@code application/problem+json} response (RFC 9457). Business
 * exceptions carry their own mapping; framework and DB errors are normalized here. Validation is
 * deliberately reported as 422 (not the default 400) so the frontend resolves it as a field-level
 * error rather than a whole-page failure.
 */
@ApplicationScoped
public class ProblemMappers {

    private static final Logger LOG = Logger.getLogger(ProblemMappers.class);

    @Inject
    UniqueConstraintRegistry uniqueConstraints;

    @ServerExceptionMapper
    public RestResponse<ProblemDetail> mapBusinessException(AppException ex) {
        return problem(ex.status(), ex.type(), ex.getMessage(), ex.errors());
    }

    @ServerExceptionMapper
    public RestResponse<ProblemDetail> mapValidation(ConstraintViolationException ex) {
        List<FieldErrorEntry> errors = ex.getConstraintViolations().stream()
                .map(violation -> new FieldErrorEntry(
                        lastNode(violation.getPropertyPath()), violation.getMessage(), ruleCode(violation)))
                .toList();
        return problem(422, "urn:problem:validation", "Validation failed", errors);
    }

    @ServerExceptionMapper
    public RestResponse<ProblemDetail> mapOptimisticLock(OptimisticLockException ex) {
        return problem(409, "urn:problem:conflict-version", "Resource was modified concurrently", null);
    }

    @ServerExceptionMapper
    public RestResponse<ProblemDetail> mapUniqueConstraint(
            org.hibernate.exception.ConstraintViolationException ex) {
        // A mapper cannot re-dispatch a rethrow, so non-unique violations (FK, check, ...) are
        // formatted as 500 directly rather than passed on.
        if (ex.getKind() != ConstraintKind.UNIQUE) {
            LOG.error("Unexpected non-unique constraint violation", ex);
            return problem(500, "about:blank", "Internal server error", null);
        }
        List<FieldErrorEntry> errors = uniqueConstraints.resolve(ex.getConstraintName());
        return problem(409, "urn:problem:conflict-unique", "Already in use", errors);
    }

    /**
     * Last-resort mapper. Its low precedence keeps framework {@link WebApplicationException}s
     * (404/405/415, ...) from being turned into 500s; only genuinely unexpected errors become 500,
     * and their message is never leaked to the client.
     */
    @ServerExceptionMapper(priority = Priorities.USER + 100)
    public RestResponse<ProblemDetail> mapUnexpected(Exception ex) {
        if (ex instanceof WebApplicationException webError) {
            int status = webError.getResponse().getStatus();
            return problem(status, "about:blank", webError.getMessage(), null);
        }
        LOG.error("Unhandled exception", ex);
        return problem(500, "about:blank", "Internal server error", null);
    }

    private RestResponse<ProblemDetail> problem(int status, String type, String detail,
                                                List<FieldErrorEntry> errors) {
        ProblemDetail body = new ProblemDetail(type, titleFor(type, status), status, detail, errors);
        return RestResponse.ResponseBuilder.<ProblemDetail>create(status)
                .entity(body)
                .type("application/problem+json")
                .build();
    }

    // RFC 9457 ties the title to the type, so resolve known types to a fixed title and fall back to
    // the HTTP reason phrase otherwise.
    private static String titleFor(String type, int status) {
        return switch (type) {
            case "urn:problem:validation" -> "Validation Failed";
            case "urn:problem:conflict-unique" -> "Already In Use";
            case "urn:problem:conflict-version" -> "Version Conflict";
            default -> reasonPhrase(status);
        };
    }

    private static String reasonPhrase(int status) {
        Response.Status resolved = Response.Status.fromStatusCode(status);
        return resolved != null ? resolved.getReasonPhrase() : "Error";
    }

    private static String lastNode(Path path) {
        String name = null;
        for (Path.Node node : path) {
            name = node.getName();
        }
        return name;
    }

    private static String ruleCode(ConstraintViolation<?> violation) {
        String annotation = violation.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName();
        return switch (annotation) {
            case "NotBlank", "NotNull", "NotEmpty" -> "required";
            case "Size" -> "size";
            default -> null;
        };
    }
}
