package br.edu.unifal.readingtracker.exception;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.edu.unifal.readingtracker.config.ValidationMessages;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

/** Test-only controller that triggers each kind of error handled by GlobalExceptionHandler. */
@RestController
@RequestMapping("/api/test-errors")
class ErrorTestController {

	record TestBody(@NotBlank(message = ValidationMessages.REQUIRED) String title, Integer year, Double grade,
			List<Long> ids) {
	}

	@GetMapping("/bad-request")
	void badRequest() {
		new ValidationErrors()
				.add("yearRead", ValidationMessages.REQUIRED_YEAR)
				.add("grade", ValidationMessages.GRADE)
				.throwIfAny();
	}

	@GetMapping("/not-found")
	void notFound() {
		throw ApiException.notFound();
	}

	@GetMapping("/conflict")
	void conflict() {
		throw ApiException.conflict(ValidationMessages.DUPLICATE_AUTHOR);
	}

	@GetMapping("/linked-author")
	void linkedAuthor() {
		throw ApiException.conflict(ValidationMessages.linkedAuthor(List.of("Crime and Punishment", "The Idiot")));
	}

	@GetMapping("/unexpected")
	void unexpected() {
		throw new IllegalStateException("internal detail that must not leak");
	}

	@GetMapping("/items/{id}")
	Long item(@PathVariable Long id) {
		return id;
	}

	@PostMapping("/body")
	TestBody body(@Valid @RequestBody TestBody body) {
		return body;
	}

}
