package br.edu.unifal.readingtracker.exception;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import br.edu.unifal.readingtracker.config.ValidationMessages;

/** Every error response has the body {status, message, errors} from assignment Section 7. */
@WebMvcTest(ErrorTestController.class)
class GlobalExceptionHandlerTests {

	private static final String BASE = "/api/test-errors";

	@Autowired
	MockMvc mvc;

	@Test
	void badRequestListsEveryInvalidField() throws Exception {
		mvc.perform(get(BASE + "/bad-request"))
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.message").value("Validation failed"))
				.andExpect(jsonPath("$.errors", hasSize(2)))
				.andExpect(jsonPath("$.errors[0].field").value("yearRead"))
				.andExpect(jsonPath("$.errors[0].message").value("Year read is required when status is Read."))
				.andExpect(jsonPath("$.errors[1].field").value("grade"))
				.andExpect(jsonPath("$.errors[1].message").value("Grade must be between 0 and 10 in steps of 0.5."));
	}

	@Test
	void notFoundHasEmptyErrors() throws Exception {
		expectError(mvc.perform(get(BASE + "/not-found")), 404, "Record not found.");
	}

	@Test
	void conflictKeepsMessageExpectedByFrontend() throws Exception {
		expectError(mvc.perform(get(BASE + "/conflict")), 409, "An author with this name already exists.");
	}

	@Test
	void linkedAuthorConflictNamesTheBooks() throws Exception {
		expectError(mvc.perform(get(BASE + "/linked-author")), 409,
				"Author is linked to 2 book(s): Crime and Punishment, The Idiot");
	}

	@Test
	void unexpectedErrorReturns500WithoutInternalDetails() throws Exception {
		expectError(mvc.perform(get(BASE + "/unexpected")), 500, ValidationMessages.UNEXPECTED)
				.andExpect(content().string(not(containsString("internal detail"))));
	}

	@Test
	void malformedJsonReturns400() throws Exception {
		expectError(postJson("{\"title\": "), 400, "The request body is not valid JSON.");
	}

	@Test
	void bodyThatIsNotAnObjectIsReportedOnRecord() throws Exception {
		expectFieldError(postJson("[]"), "record", "Provide a record object.");
	}

	@Test
	void textInIntegerFieldIsReportedOnThatField() throws Exception {
		expectFieldError(postJson("{\"title\": \"Stoner\", \"year\": \"abc\"}"), "year", "Enter a whole number.");
	}

	/** Regression: Jackson used to truncate 1965.5 to 1965 silently, saving invalid data. */
	@Test
	void decimalInIntegerFieldIsRejectedInsteadOfTruncated() throws Exception {
		expectFieldError(postJson("{\"title\": \"Stoner\", \"year\": 1965.5}"), "year", "Enter a whole number.");
	}

	@Test
	void decimalInIntegerListIsRejectedInsteadOfTruncated() throws Exception {
		expectFieldError(postJson("{\"title\": \"Stoner\", \"ids\": [1.5]}"), "ids", "Enter a whole number.");
	}

	@Test
	void textInDecimalFieldIsReportedOnThatField() throws Exception {
		expectFieldError(postJson("{\"title\": \"Stoner\", \"grade\": \"high\"}"), "grade", "Enter a number.");
	}

	@Test
	void invalidListItemIsReportedOnTheList() throws Exception {
		expectFieldError(postJson("{\"title\": \"Stoner\", \"ids\": [\"x\"]}"), "ids", "Enter a whole number.");
	}

	@Test
	void beanValidationErrorsUseTheSameFormat() throws Exception {
		expectFieldError(postJson("{\"title\": \"  \"}"), "title", "This field is required.");
	}

	@Test
	void validBodyIsAccepted() throws Exception {
		postJson("{\"title\": \"Stoner\", \"year\": 1965, \"grade\": 8.5, \"ids\": [1, 2]}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.year").value(1965));
	}

	@Test
	void nonNumericIdReturns400OnId() throws Exception {
		expectFieldError(mvc.perform(get(BASE + "/items/abc")), "id", "Use a positive integer ID.");
	}

	@Test
	void unknownRouteReturns404InApiFormat() throws Exception {
		expectError(mvc.perform(get("/api/does-not-exist")), 404, "Resource not found.");
	}

	@Test
	void unsupportedMethodReturns405WithAllowHeader() throws Exception {
		expectError(mvc.perform(delete(BASE + "/items/1")), 405, ValidationMessages.METHOD_NOT_ALLOWED)
				.andExpect(header().string("Allow", containsString("GET")));
	}

	@Test
	void nonJsonBodyReturns415() throws Exception {
		expectError(mvc.perform(post(BASE + "/body").contentType(MediaType.TEXT_PLAIN).content("Stoner")),
				415, ValidationMessages.UNSUPPORTED_MEDIA_TYPE);
	}

	private ResultActions postJson(String json) throws Exception {
		return mvc.perform(post(BASE + "/body").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private ResultActions expectError(ResultActions result, int status, String message) throws Exception {
		return result
				.andExpect(status().is(status))
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.status").value(status))
				.andExpect(jsonPath("$.message").value(message))
				.andExpect(jsonPath("$.errors", hasSize(0)));
	}

	private ResultActions expectFieldError(ResultActions result, String field, String message) throws Exception {
		return result
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.message").value("Validation failed"))
				.andExpect(jsonPath("$.errors", hasSize(1)))
				.andExpect(jsonPath("$.errors[0].field").value(field))
				.andExpect(jsonPath("$.errors[0].message").value(message));
	}

}
