package br.edu.unifal.readingtracker.exception;

import java.util.ArrayList;
import java.util.List;

/**
 * Collects every invalid field of a request so the client receives all problems at once,
 * instead of fixing them one by one.
 *
 * <pre>
 * ValidationErrors errors = new ValidationErrors();
 * if (title == null) errors.add("title", ValidationMessages.REQUIRED);
 * errors.throwIfAny();   // 400 with all collected fields
 * </pre>
 */
public class ValidationErrors {

	private final List<FieldErrorDto> errors = new ArrayList<>();

	public ValidationErrors add(String field, String message) {
		errors.add(new FieldErrorDto(field, message));
		return this;
	}

	public boolean hasErrors() {
		return !errors.isEmpty();
	}

	public boolean hasErrorFor(String field) {
		return errors.stream().anyMatch(error -> error.field().equals(field));
	}

	public List<FieldErrorDto> asList() {
		return List.copyOf(errors);
	}

	public void throwIfAny() {
		if (hasErrors()) {
			throw ApiException.badRequest(errors);
		}
	}

}
