package jp.co.monocrea.app.exception;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.parsing.Parser;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

@QuarkusTest
class ProblemMappersTest {

    @BeforeAll
    static void parseProblemJsonAsJson() {
        RestAssured.registerParser("application/problem+json", Parser.JSON);
    }

    @Test
    void businessExceptionBecomesProblemJson() {
        given()
                .when().get("/probe/not-found")
                .then()
                .statusCode(404)
                .contentType(containsString("application/problem+json"))
                .body("type", equalTo("urn:problem:not-found"))
                .body("status", equalTo(404))
                .body("title", equalTo("Not Found"))
                .body("detail", containsString("Probe"))
                .body("$", not(hasKey("instance")));
    }

    @Test
    void versionConflictOmitsErrorsArray() {
        given()
                .when().get("/probe/version-conflict")
                .then()
                .statusCode(409)
                .contentType(containsString("application/problem+json"))
                .body("type", equalTo("urn:problem:conflict-version"))
                .body("title", equalTo("Version Conflict"))
                .body("$", not(hasKey("errors")));
    }

    @Test
    void beanValidationBecomes422WithFieldError() {
        given()
                .contentType("application/json")
                .body("{\"name\":\"\"}")
                .when().post("/probe/validate")
                .then()
                .statusCode(422)
                .contentType(containsString("application/problem+json"))
                .body("type", equalTo("urn:problem:validation"))
                .body("title", equalTo("Validation Failed"))
                .body("errors[0].name", equalTo("name"))
                .body("errors[0].message", notNullValue());
    }

    @Test
    void unexpectedExceptionBecomes500WithoutLeakingDetail() {
        given()
                .when().get("/probe/boom")
                .then()
                .statusCode(500)
                .body("status", equalTo(500))
                .body("detail", equalTo("Internal server error"));
    }

    @Test
    void methodNotAllowedIsNotTurnedInto500() {
        given()
                .when().post("/probe/not-found")
                .then()
                .statusCode(405);
    }

    @Test
    void unsupportedMediaTypeIsNotTurnedInto500() {
        given()
                .contentType("text/plain")
                .body("hello")
                .when().post("/probe/validate")
                .then()
                .statusCode(415);
    }
}
