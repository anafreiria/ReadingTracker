package br.edu.unifal.readingtracker.exception;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import br.edu.unifal.readingtracker.config.ValidationMessages;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.MismatchedInputException;

/**
 * The only place where exceptions become HTTP responses. Every error has the body
 * {@code {status, message, errors}} required by the assignment (Section 7), so the frontend
 * can always read {@code message} and show each {@code errors[i]} next to its field.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	/** Rule violations raised by services: 400, 404 or 409. */
	@ExceptionHandler(ApiException.class)
	public ResponseEntity<ApiError> handleApiException(ApiException ex) {
		return ResponseEntity.status(ex.getStatus()).body(ex.toApiError());
	}

	/** Bean Validation annotations on a {@code @Valid} request body. */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleBeanValidation(MethodArgumentNotValidException ex) {
		List<FieldErrorDto> errors = ex.getBindingResult().getFieldErrors().stream()
				.map(error -> new FieldErrorDto(error.getField(),
						Objects.requireNonNullElse(error.getDefaultMessage(), ValidationMessages.FAILED)))
				.toList();
		return badRequest(errors);
	}

	/**
	 * Body that is not valid JSON, or a value of the wrong type ({@code "grade": "abc"}).
	 * When Jackson knows which property failed, the error is reported on that field.
	 */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException ex) {
		if (ex.getCause() instanceof MismatchedInputException mismatch) {
			String field = lastPropertyName(mismatch);
			if (field == null) {
				return badRequest(List.of(new FieldErrorDto("record", ValidationMessages.RECORD)));
			}
			return badRequest(List.of(new FieldErrorDto(field, messageForType(mismatch.getTargetType()))));
		}
		return ResponseEntity.badRequest().body(new ApiError(HttpStatus.BAD_REQUEST.value(), ValidationMessages.MALFORMED_JSON));
	}

	/** Path variable that is not a number, e.g. {@code GET /api/authors/abc}. */
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
		String field = ex.getName();
		String message = field.equalsIgnoreCase("id") || field.endsWith("Id")
				? ValidationMessages.ID
				: messageForType(ex.getRequiredType());
		return badRequest(List.of(new FieldErrorDto(field, message)));
	}

	/** URL that matches no endpoint or static file. */
	@ExceptionHandler({ NoResourceFoundException.class, NoHandlerFoundException.class })
	public ResponseEntity<ApiError> handleRouteNotFound(Exception ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(new ApiError(HttpStatus.NOT_FOUND.value(), ValidationMessages.ROUTE_NOT_FOUND));
	}

	/** Existing URL with an unsupported method, e.g. {@code DELETE /api/countries/1}. */
	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<ApiError> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
		HttpHeaders headers = new HttpHeaders();
		if (ex.getSupportedHttpMethods() != null) {
			headers.setAllow(ex.getSupportedHttpMethods());
		}
		return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).headers(headers)
				.body(new ApiError(HttpStatus.METHOD_NOT_ALLOWED.value(), ValidationMessages.METHOD_NOT_ALLOWED));
	}

	/** Body sent with a content type other than JSON. */
	@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
	public ResponseEntity<ApiError> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
		return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(
				new ApiError(HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(), ValidationMessages.UNSUPPORTED_MEDIA_TYPE));
	}

	/** Anything unexpected: logged on the server, never exposed to the client. */
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
		log.error("Unexpected error while handling request", ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiError(HttpStatus.INTERNAL_SERVER_ERROR.value(), ValidationMessages.UNEXPECTED));
	}

	private static ResponseEntity<ApiError> badRequest(List<FieldErrorDto> errors) {
		return ResponseEntity.badRequest().body(ApiException.badRequest(errors).toApiError());
	}

	/** Innermost JSON property in the failing path: {@code authorIds[0]} gives {@code authorIds}. */
	private static String lastPropertyName(JacksonException ex) {
		String name = null;
		for (JacksonException.Reference reference : ex.getPath()) {
			if (reference.getPropertyName() != null) {
				name = reference.getPropertyName();
			}
		}
		return name;
	}

	private static String messageForType(Class<?> type) {
		if (type == null) {
			return ValidationMessages.INVALID_VALUE;
		}
		if (type == Integer.class || type == int.class || type == Long.class || type == long.class
				|| type == Short.class || type == short.class) {
			return ValidationMessages.INTEGER;
		}
		if (Number.class.isAssignableFrom(type) || type == double.class || type == float.class) {
			return ValidationMessages.NUMBER;
		}
		if (type == String.class) {
			return ValidationMessages.TEXT;
		}
		if (Collection.class.isAssignableFrom(type) || type.isArray()) {
			return ValidationMessages.LIST;
		}
		return ValidationMessages.INVALID_VALUE;
	}

}
