package br.edu.unifal.readingtracker.exception;

import java.util.List;

import br.edu.unifal.readingtracker.config.ValidationMessages;

/**
 * Exception thrown by services when a request breaks a rule. Services choose the kind of
 * failure through the factory methods; {@link GlobalExceptionHandler} turns it into the
 * HTTP response, so services never build responses themselves.
 */
public class ApiException extends RuntimeException {

	public static final int BAD_REQUEST = 400;
	public static final int NOT_FOUND = 404;
	public static final int CONFLICT = 409;

	private final int status;
	private final List<FieldErrorDto> errors;

	private ApiException(int status, String message, List<FieldErrorDto> errors) {
		super(message);
		this.status = status;
		this.errors = List.copyOf(errors);
	}

	/** 400 "Validation failed" with one entry per invalid field. */
	public static ApiException badRequest(List<FieldErrorDto> errors) {
		return new ApiException(BAD_REQUEST, ValidationMessages.FAILED, errors);
	}

	/** 400 for a single invalid field. */
	public static ApiException badRequest(String field, String message) {
		return badRequest(List.of(new FieldErrorDto(field, message)));
	}

	/** 404 "Record not found." with an empty errors list. */
	public static ApiException notFound() {
		return new ApiException(NOT_FOUND, ValidationMessages.NOT_FOUND, List.of());
	}

	/** 409 with the given message and an empty errors list (duplicate name, linked author). */
	public static ApiException conflict(String message) {
		return new ApiException(CONFLICT, message, List.of());
	}

	public int getStatus() {
		return status;
	}

	public List<FieldErrorDto> getErrors() {
		return errors;
	}

	public ApiError toApiError() {
		return new ApiError(status, getMessage(), errors);
	}

}
