package jp.co.monocrea.feature.user.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusIntegrationTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.parsing.Parser;

@QuarkusIntegrationTest 
class UserResourceIT {
    @BeforeAll 
    static void parseProblemJsonAsJson(){
        RestAssured.registerParser("application/problem+json", Parser.JSON);
    }

    @Test 
    void createReturns201AndPersistedUser(){
        String loginId = uniqueLoginId("create");

        given()
            .contentType(ContentType.JSON)
            .body(Map.of("loginId", loginId, "fullName", "Taro Yamada" ))
            .when().post("users")
            .then()
            .statusCode(201)
            .body("id", notNullValue())
            .body("loginId", equalTo(loginId))
            .body("fullName", equalTo("Taro Yamada"))
            .body("version", equalTo(0));
    }

    @Test
    void getReturnsCreatedUser(){
        String loginId = uniqueLoginId("get");
        String id = createUser(loginId, "Hanako Suzuki");

        given()
            .when().get("/users/{id}", id)
            .then()
            .statusCode(200)
            .body("id", equalTo(id))
            .body("loginId", equalTo(loginId))
            .body("fullName", equalTo("Hanako Suzuki"))
            .body("$", not(hasKey("deletedAt")));
    }

    @Test 
    void getUnknownIdReturns404(){
        given()
            .when().get("/users/{id}", UUID.randomUUID().toString())
            .then()
            .statusCode(404)
            .contentType(containsString("application/problem+json"))
            .body("status", equalTo(404));
    }

    @Test 
    void listFiltersSortsAndPaginates(){
        String prefix = uniqueLoginId("list");
        createUser(prefix + "-a", "List A");
        createUser(prefix + "-b", "List B");
        createUser(prefix + "-c", "List C");

        given()
            .queryParam("loginId", prefix)
            .queryParam("page", 0)
            .queryParam("size", 2)
            .queryParam("sort", "loginId,desc")
            .when().get("/users")
            .then()
            .statusCode(200)
            .body("totalCount", equalTo(3))
            .body("totalPages", equalTo(2))
            .body("items.loginId", contains(prefix + "-c", prefix + "-b"));
    }

    @Test 
    void updateChangesUserAndIncrementsVersion(){
        String loginId = uniqueLoginId("update");
        String id = createUser(loginId, "Before");

        given()
            .contentType(ContentType.JSON)
            .body(Map.of("loginId", loginId, "fullName", "After", "version", 0))
            .when().patch("/users/{id}", id)
            .then()
            .statusCode(200)
            .body("fullName", equalTo("After"))
            .body("version", equalTo(1));
    }

    @Test 
    void updateWithStaleVersionsReturns409(){
        String loginId = uniqueLoginId("stale");
        String id = createUser(loginId, "StaleName");

        given()
            .contentType(ContentType.JSON)
            .body(Map.of("loginId", loginId, "fullName", "Name", "version", 99))
            .when().patch("/users/{id}", id)
            .then()
            .statusCode(409)
            .body("type", equalTo("urn:problem:conflict-version"));
    }

    @Test 
    void deleteReturns204AndUserIsNoLongerFound(){
        String loginId = uniqueLoginId("delete");
        String id = createUser(loginId, "To Delete");

        given()
            .queryParam("version", 0)
            .when().delete("/users/{id}", id)
            .then()
            .statusCode(204);

        given()
            .when().get("/users/{id}", id)
            .then()
            .statusCode(404);
    }

    @Test 
    void createWithBlankLoginIdReturns422(){
        given()
            .contentType(ContentType.JSON)
            .body(Map.of("loginId", "", "fullName", "Name"))
            .when().post("/users")
            .then()
            .statusCode(422)
            .body("type", equalTo("urn:problem:validation"))
            .body("errors.name", hasItem("loginId"));
    }

    @Test
    void createWithDuplicateLoginIdReturns409(){
        String loginId = uniqueLoginId("dup");
        createUser(loginId, "First");

        given()
            .contentType(ContentType.JSON)
            .body(Map.of("loginId", loginId, "fullName", "Second"))
            .when().post("/users")
            .then()
            .statusCode(409)
            .body("type", equalTo("urn:problem:conflict-unique"));
    }

    private static String createUser(String loginId, String fullName){
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of("loginId", loginId, "fullName", fullName))
                .when().post("users")
                .then()
                .statusCode(201)
                .extract().path("id");
    }

    private static String uniqueLoginId(String label){
        return "it-" + label + "-" + UUID.randomUUID().toString().substring(0,8);
    }
}
