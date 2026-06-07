package jp.co.monocrea.feature.user.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.parsing.Parser;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

@QuarkusTest
class UserResourceTest {

    private static final String PREFIX = "e2e-";

    @Inject
    EntityManager entityManager;

    @BeforeAll
    static void parseProblemJsonAsJson() {
        RestAssured.registerParser("application/problem+json", Parser.JSON);
    }

    @AfterEach
    void removeTestRows() {
        QuarkusTransaction.requiringNew().run(() -> entityManager
                .createNativeQuery("delete from app.users where login_id like 'e2e-%'")
                .executeUpdate());
    }

    @Test
    void listReturnsPageEnvelopeWithCamelCaseFieldsAndNoDeletedAt() {
        createUser("e2e-list-1", "List One");
        createUser("e2e-list-2", "List Two");
        createUser("e2e-list-3", "List Three");

        given()
                .queryParam("loginId", PREFIX)
                .queryParam("page", 0)
                .queryParam("size", 2)
                .when().get("/users")
                .then()
                .statusCode(200)
                .body("page", equalTo(0))
                .body("size", equalTo(2))
                .body("totalCount", equalTo(3))
                .body("totalPages", equalTo(2))
                .body("items.size()", equalTo(2))
                .body("items[0].loginId", notNullValue())
                .body("items[0].fullName", notNullValue())
                .body("items[0].version", equalTo(0))
                .body("items[0].createdAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}T.*Z"))
                .body("items[0]", not(hasKey("deletedAt")));
    }

    @Test
    void listAppliesDescendingSortFromSingleQueryValue() {
        createUser("e2e-sort-aaa", "Aaa");
        createUser("e2e-sort-bbb", "Bbb");
        createUser("e2e-sort-ccc", "Ccc");

        given()
                .queryParam("loginId", "e2e-sort-")
                .queryParam("sort", "loginId,desc")
                .when().get("/users")
                .then()
                .statusCode(200)
                .body("items[0].loginId", equalTo("e2e-sort-ccc"))
                .body("items[2].loginId", equalTo("e2e-sort-aaa"));
    }

    @Test
    void getReturnsUserWithoutDeletedAt() {
        String id = createUser("e2e-get", "Get Target");

        given()
                .when().get("/users/{id}", id)
                .then()
                .statusCode(200)
                .body("id", equalTo(id))
                .body("loginId", equalTo("e2e-get"))
                .body("fullName", equalTo("Get Target"))
                .body("version", equalTo(0))
                .body("$", not(hasKey("deletedAt")));
    }

    @Test
    void getUnknownIdReturns404ProblemJson() {
        given()
                .when().get("/users/{id}", UUID.randomUUID().toString())
                .then()
                .statusCode(404)
                .contentType(containsString("application/problem+json"))
                .body("status", equalTo(404));
    }

    @Test
    void createReturns201WithBody() {
        given()
                .contentType(ContentType.JSON)
                .body(userJson("e2e-create", "Created User"))
                .when().post("/users")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("loginId", equalTo("e2e-create"))
                .body("fullName", equalTo("Created User"))
                .body("version", equalTo(0))
                .body("createdAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}T.*Z"))
                .body("$", not(hasKey("deletedAt")));
    }

    @Test
    void createWithBlankLoginIdReturns422Validation() {
        given()
                .contentType(ContentType.JSON)
                .body(userJson("", "No Login"))
                .when().post("/users")
                .then()
                .statusCode(422)
                .body("type", equalTo("urn:problem:validation"))
                .body("errors.find { it.name == 'loginId' }", notNullValue());
    }

    @Test
    void createDuplicateLoginIdReturns409Unique() {
        createUser("e2e-dup", "First");

        given()
                .contentType(ContentType.JSON)
                .body(userJson("e2e-dup", "Second"))
                .when().post("/users")
                .then()
                .statusCode(409)
                .body("type", equalTo("urn:problem:conflict-unique"))
                .body("errors[0].name", equalTo("loginId"));
    }

    @Test
    void createWithSoftDeletedLoginIdReturns409() {
        String id = createUser("e2e-reuse", "First");
        deleteUser(id, 0);

        given()
                .contentType(ContentType.JSON)
                .body(userJson("e2e-reuse", "Second"))
                .when().post("/users")
                .then()
                .statusCode(409)
                .body("type", equalTo("urn:problem:conflict-unique"))
                .body("errors[0].name", equalTo("loginId"));
    }

    @Test
    void updateModifiesUserAndIncrementsVersion() {
        String id = createUser("e2e-upd", "Old Name");

        given()
                .contentType(ContentType.JSON)
                .body(updateJson("e2e-upd", "New Name", 0))
                .when().patch("/users/{id}", id)
                .then()
                .statusCode(200)
                .body("fullName", equalTo("New Name"))
                .body("version", equalTo(1));
    }

    @Test
    void updateWithStaleVersionReturns409ConflictWithoutErrors() {
        String id = createUser("e2e-stale", "Name");

        given()
                .contentType(ContentType.JSON)
                .body(updateJson("e2e-stale", "Name", 99))
                .when().patch("/users/{id}", id)
                .then()
                .statusCode(409)
                .body("type", equalTo("urn:problem:conflict-version"))
                .body("$", not(hasKey("errors")));
    }

    @Test
    void updateWithMissingVersionReturns422() {
        String id = createUser("e2e-nover", "Name");

        given()
                .contentType(ContentType.JSON)
                .body("{\"loginId\":\"e2e-nover\",\"fullName\":\"Name\"}")
                .when().patch("/users/{id}", id)
                .then()
                .statusCode(422)
                .body("type", equalTo("urn:problem:validation"))
                .body("errors.find { it.name == 'version' }", notNullValue());
    }

    @Test
    void updateUnknownIdReturns404() {
        given()
                .contentType(ContentType.JSON)
                .body(updateJson("e2e-ghost", "Ghost", 0))
                .when().patch("/users/{id}", UUID.randomUUID().toString())
                .then()
                .statusCode(404);
    }

    @Test
    void deleteSoftDeletesAndSubsequentGetReturns404() {
        String id = createUser("e2e-del", "To Delete");

        deleteUser(id, 0);
        given().when().get("/users/{id}", id).then().statusCode(404);
    }

    @Test
    void deleteWithMissingVersionReturns422() {
        String id = createUser("e2e-delnover", "Name");

        given()
                .when().delete("/users/{id}", id)
                .then()
                .statusCode(422)
                .body("type", equalTo("urn:problem:validation"));
    }

    @Test
    void deleteWithStaleVersionReturns409() {
        String id = createUser("e2e-delstale", "Name");

        given()
                .queryParam("version", 99)
                .when().delete("/users/{id}", id)
                .then()
                .statusCode(409)
                .body("type", equalTo("urn:problem:conflict-version"));
    }

    private String createUser(String loginId, String fullName) {
        return given()
                .contentType(ContentType.JSON)
                .body(userJson(loginId, fullName))
                .when().post("/users")
                .then()
                .statusCode(201)
                .extract().path("id");
    }

    private void deleteUser(String id, int version) {
        given()
                .queryParam("version", version)
                .when().delete("/users/{id}", id)
                .then()
                .statusCode(204);
    }

    private static String userJson(String loginId, String fullName) {
        return "{\"loginId\":\"%s\",\"fullName\":\"%s\"}".formatted(loginId, fullName);
    }

    private static String updateJson(String loginId, String fullName, int version) {
        return "{\"loginId\":\"%s\",\"fullName\":\"%s\",\"version\":%d}".formatted(loginId, fullName, version);
    }
}
