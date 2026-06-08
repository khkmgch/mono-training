package jp.co.monocrea.app.exception;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;
import jp.co.monocrea.core.error.NotFoundException;
import jp.co.monocrea.core.error.VersionConflictException;

/** Test-only endpoints that trigger each exception path so the mappers can be verified in isolation. */
@Path("/probe")
@Produces(MediaType.APPLICATION_JSON)
public class ProblemMapperProbeResource {

    public record ProbeBody(@NotBlank String name) {}

    @GET
    @Path("/not-found")
    public String notFound() {
        throw new NotFoundException("Probe", UUID.fromString("00000000-0000-0000-0000-000000000001"));
    }

    @GET
    @Path("/version-conflict")
    public String versionConflict() {
        throw new VersionConflictException("Probe", UUID.fromString("00000000-0000-0000-0000-000000000002"));
    }

    @GET
    @Path("/boom")
    public String boom() {
        throw new IllegalStateException("synthetic failure with secret detail");
    }

    @POST
    @Path("/validate")
    @Consumes(MediaType.APPLICATION_JSON)
    public String validate(@Valid ProbeBody body) {
        return body.name();
    }
}
