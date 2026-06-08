package jp.co.monocrea.feature.user.resource;

import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.BeanParam;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;
import jp.co.monocrea.app.web.PageQuery;
import jp.co.monocrea.core.page.PageResponse;
import jp.co.monocrea.feature.user.dto.CreateUserRequest;
import jp.co.monocrea.feature.user.dto.UpdateUserRequest;
import jp.co.monocrea.feature.user.dto.UserResponse;
import jp.co.monocrea.feature.user.service.UserService;
import org.jboss.resteasy.reactive.ResponseStatus;
import org.jboss.resteasy.reactive.RestQuery;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@RunOnVirtualThread
public class UserResource {

    @Inject
    UserService service;

    @GET
    public PageResponse<UserResponse> list(@BeanParam PageQuery page,
                                           @RestQuery String loginId, @RestQuery String fullName) {
        return service.list(page.toPageRequest(), loginId, fullName);
    }

    @GET
    @Path("/{id}")
    public UserResponse get(UUID id) {
        return service.get(id);
    }

    @POST
    @ResponseStatus(201)
    public UserResponse create(@Valid CreateUserRequest request) {
        return service.create(request);
    }

    @PATCH
    @Path("/{id}")
    public UserResponse update(UUID id, @Valid UpdateUserRequest request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    @ResponseStatus(204)
    public void delete(UUID id, @RestQuery @NotNull Integer version) {
        service.delete(id, version);
    }
}
