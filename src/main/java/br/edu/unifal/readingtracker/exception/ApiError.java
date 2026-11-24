package br.edu.unifal.readingtracker.exception;

import java.util.List;

/**
 * Body of every error response (assignment Section 7):
 *
 * <pre>
 * {"status": 400, "message": "Validation failed",
 *  "errors": [{"field": "yearRead", "message": "Year read is required when status is Read."}]}
 * </pre>
 *
 * 404 and 409 use the same shape with an empty {@code errors} list.
 */
public record ApiError(int status, String message, List<FieldErrorDto> errors) {

	public ApiError {
		errors = errors == null ? List.of() : List.copyOf(errors);
	}

	public ApiError(int status, String message) {
		this(status, message, List.of());
	}

}
