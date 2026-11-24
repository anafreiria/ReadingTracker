package br.edu.unifal.readingtracker.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ApiExceptionTests {

	@Test
	void factoriesSetStatusMessageAndErrors() {
		assertThat(ApiException.badRequest("title", "This field is required.").toApiError())
				.isEqualTo(new ApiError(400, "Validation failed",
						java.util.List.of(new FieldErrorDto("title", "This field is required."))));
		assertThat(ApiException.notFound().toApiError()).isEqualTo(new ApiError(404, "Record not found."));
		assertThat(ApiException.conflict("Duplicate").toApiError()).isEqualTo(new ApiError(409, "Duplicate"));
	}

	@Test
	void apiErrorNeverHasNullErrors() {
		assertThat(new ApiError(404, "Record not found.", null).errors()).isEmpty();
	}

	@Test
	void validationErrorsOnlyThrowWhenSomethingWasAdded() {
		assertThatCode(() -> new ValidationErrors().throwIfAny()).doesNotThrowAnyException();

		ValidationErrors errors = new ValidationErrors().add("name", "This field is required.");
		assertThat(errors.hasErrorFor("name")).isTrue();
		assertThat(errors.hasErrorFor("countryId")).isFalse();
		assertThatThrownBy(errors::throwIfAny)
				.isInstanceOfSatisfying(ApiException.class, ex -> {
					assertThat(ex.getStatus()).isEqualTo(400);
					assertThat(ex.getErrors()).containsExactly(new FieldErrorDto("name", "This field is required."));
				});
	}

}
