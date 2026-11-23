package br.edu.unifal.readingtracker.config;

import java.util.List;

/**
 * Error messages returned by the API, kept in one place (assignment Section 1).
 *
 * <p>The domain messages are copied word for word from {@code TEXT.validation} in
 * {@code frontend/js/strings.js}. The frontend relies on this: for example, the author form
 * only shows a 409 under the Name field when the message is exactly {@link #DUPLICATE_AUTHOR}.
 * Change both files together.
 */
public final class ValidationMessages {

	// Same text as TEXT.validation in frontend/js/strings.js
	public static final String FAILED = "Validation failed";
	public static final String REQUIRED = "This field is required.";
	public static final String TEXT = "Enter text for this field.";
	public static final String INTEGER = "Enter a whole number.";
	public static final String NUMBER = "Enter a number.";
	public static final String REFERENCE = "Choose an existing record.";
	public static final String SELECTION = "Choose a value from the list.";
	public static final String LIST = "Choose a list of existing records without duplicates.";
	public static final String DATE = "Enter a valid date in YYYY-MM-DD format.";
	public static final String FUTURE_BIRTH = "Birth date cannot be in the future.";
	public static final String DEATH = "Death date must be after birth date.";
	public static final String PUBLICATION = "Publication year cannot be zero or in the future.";
	public static final String EXISTING_READINGS = "Publication year cannot be later than the year of an existing reading.";
	public static final String YEAR_READ = "Year read cannot be in the future or before publication.";
	public static final String REQUIRED_YEAR = "Year read is required when status is Read.";
	public static final String NO_YEAR = "Year read is only allowed when status is Read or Abandoned.";
	public static final String GRADE = "Grade must be between 0 and 10 in steps of 0.5.";
	public static final String NO_GRADE = "Grade is only allowed when status is Read or Abandoned.";
	public static final String PRIORITY = "Priority is only allowed when status is Want to read.";
	public static final String ID = "Use a positive integer ID.";
	public static final String RECORD = "Provide a record object.";
	public static final String DUPLICATE_AUTHOR = "An author with this name already exists.";
	public static final String DUPLICATE_THEME = "A theme with this name already exists.";
	public static final String NOT_FOUND = "Record not found.";
	public static final String CREATE_ONLY = "This operation only creates new records; omit the ID.";

	// HTTP-level messages that only the server produces
	public static final String MALFORMED_JSON = "The request body is not valid JSON.";
	public static final String INVALID_VALUE = "Enter a valid value for this field.";
	public static final String ROUTE_NOT_FOUND = "Resource not found.";
	public static final String METHOD_NOT_ALLOWED = "This operation is not supported for this resource.";
	public static final String UNSUPPORTED_MEDIA_TYPE = "Send the request body as JSON (Content-Type: application/json).";
	public static final String UNEXPECTED = "Something went wrong on the server. Please try again.";

	private ValidationMessages() {
	}

	/** Same text as {@code TEXT.validation.linkedAuthor(titles)} in strings.js. */
	public static String linkedAuthor(List<String> titles) {
		return "Author is linked to " + titles.size() + " book(s): " + String.join(", ", titles);
	}

}
