package br.edu.unifal.readingtracker.service;

import java.time.Clock;
import java.time.Year;

import org.springframework.stereotype.Component;

import br.edu.unifal.readingtracker.config.ValidationMessages;
import br.edu.unifal.readingtracker.dto.ReadingDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.exception.ValidationErrors;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.Priority;
import br.edu.unifal.readingtracker.model.Reading;
import br.edu.unifal.readingtracker.model.ReadingStatus;
import br.edu.unifal.readingtracker.repository.BookRepository;

/**
 * Reading rules (assignment Section 4 and FR-04), checked on the server even if the browser
 * already did (Section 7). Mirrors {@code validateReading} in frontend/js/validation.js:
 *
 * <ul>
 * <li>book and status required;</li>
 * <li>year read required when Read, optional when Abandoned, empty otherwise; not in the future
 * and not earlier than the book's publication year;</li>
 * <li>grade only when Read or Abandoned, from 0.0 to 10.0 in steps of 0.5;</li>
 * <li>priority only when Want to read.</li>
 * </ul>
 *
 * The status workflow itself (clearing year/grade/priority after the user confirms) happens in the
 * interface; the server makes sure the saved result always follows these rules.
 */
@Component
public class ReadingValidator {

	private final BookRepository bookRepository;
	private final Clock clock;

	public ReadingValidator(BookRepository bookRepository, Clock clock) {
		this.bookRepository = bookRepository;
		this.clock = clock;
	}

	/** Validated values, ready to be copied into a {@link Reading}. */
	public record ValidReading(Book book, ReadingStatus status, Integer yearRead, Double grade,
			String recommendedBy, Priority priority, String notes) {
	}

	/**
	 * New reading for a book given by the URL ({@code POST /api/books/{id}/readings}). The body may
	 * omit {@code bookId}; if present it must be the same book.
	 */
	public ValidReading validateNew(ReadingDto input, Book book) {
		ValidationErrors errors = new ValidationErrors();
		if (input.id() != null) {
			errors.add("id", ValidationMessages.CREATE_ONLY);
		}
		if (input.bookId() != null && !input.bookId().equals(book.getId())) {
			errors.add("bookId", ValidationMessages.BOOK_MISMATCH);
		}
		return validateFields(input, book, book.getPublicationYear(), errors);
	}

	/**
	 * First reading sent together with a new book ({@code POST /api/books}). The book does not exist
	 * yet, so its publication year comes from the request and the returned value has no book; the
	 * caller sets it. {@code bookId} is ignored, as in the frontend store.
	 *
	 * @param publicationYear the new book's publication year, or {@code null} if unknown or invalid
	 */
	public ValidReading validateFirstReading(ReadingDto input, Integer publicationYear) {
		ValidationErrors errors = new ValidationErrors();
		if (input.id() != null) {
			errors.add("id", ValidationMessages.CREATE_ONLY);
		}
		return validateFields(input, null, publicationYear, errors);
	}

	/** Edit of an existing reading ({@code PUT /api/readings/{id}}): {@code bookId} is required. */
	public ValidReading validateUpdate(ReadingDto input, Long currentId) {
		ValidationErrors errors = new ValidationErrors();
		if (input.id() != null && !input.id().equals(currentId)) {
			errors.add("id", ValidationMessages.ID_MISMATCH);
		}
		Book book = null;
		if (input.bookId() == null) {
			errors.add("bookId", ValidationMessages.REQUIRED);
		} else {
			book = bookRepository.findById(input.bookId()).orElse(null);
			if (book == null) {
				errors.add("bookId", ValidationMessages.REFERENCE);
			}
		}
		return validateFields(input, book, book == null ? null : book.getPublicationYear(), errors);
	}

	/**
	 * @param book the reading's book, or {@code null} if it is invalid (already reported) or new
	 * @param publicationYear lower limit for the year read, or {@code null} when there is none
	 * @throws ApiException 400 with every invalid field
	 */
	private ValidReading validateFields(ReadingDto input, Book book, Integer publicationYear,
			ValidationErrors errors) {
		ReadingStatus status = null;
		if (input.status() == null || input.status().isEmpty()) {
			errors.add("status", ValidationMessages.REQUIRED);
		} else {
			status = ReadingStatus.fromLabel(input.status()).orElse(null);
			if (status == null) {
				errors.add("status", ValidationMessages.SELECTION);
			}
		}

		Integer yearRead = input.yearRead();
		Double grade = input.grade();

		// Rules that depend on the status are only checked when the status itself is valid
		if (status != null) {
			if (status.requiresYearRead() && yearRead == null) {
				errors.add("yearRead", ValidationMessages.REQUIRED_YEAR);
			}
			if (!status.allowsYearReadAndGrade() && yearRead != null) {
				errors.add("yearRead", ValidationMessages.NO_YEAR);
			}
			if (!status.allowsYearReadAndGrade() && grade != null) {
				errors.add("grade", ValidationMessages.NO_GRADE);
			}
		}
		if (yearRead != null && !yearInRange(yearRead, publicationYear)) {
			errors.add("yearRead", ValidationMessages.YEAR_READ);
		}
		if (grade != null && !validGrade(grade)) {
			errors.add("grade", ValidationMessages.GRADE);
		}

		Priority priority = null;
		if (input.priority() != null && !input.priority().isEmpty()) {
			priority = Priority.fromLabel(input.priority()).orElse(null);
			if (priority == null) {
				errors.add("priority", ValidationMessages.SELECTION);
			} else if (status != null && !status.allowsPriority()) {
				errors.add("priority", ValidationMessages.PRIORITY);
			}
		}

		String recommendedBy = text(input.recommendedBy(), "recommendedBy", Reading.RECOMMENDED_BY_MAX_LENGTH, errors);
		String notes = text(input.notes(), "notes", Reading.NOTES_MAX_LENGTH, errors);

		errors.throwIfAny();
		return new ValidReading(book, status, yearRead, grade, recommendedBy, priority, notes);
	}

	/** Not in the future and not earlier than the book's publication year (when known). */
	private boolean yearInRange(int yearRead, Integer publicationYear) {
		if (yearRead > Year.now(clock).getValue()) {
			return false;
		}
		return publicationYear == null || yearRead >= publicationYear;
	}

	/** 0.0 to 10.0 in steps of 0.5. */
	private static boolean validGrade(double grade) {
		return Double.isFinite(grade) && grade >= 0 && grade <= 10 && grade * 2 == Math.rint(grade * 2);
	}

	/** Optional free text: trimmed, empty becomes null, limited to the column size. */
	private static String text(String value, String field, int maxLength, ValidationErrors errors) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		if (trimmed.isEmpty()) {
			return null;
		}
		if (trimmed.length() > maxLength) {
			errors.add(field, ValidationMessages.tooLong(maxLength));
		}
		return trimmed;
	}

}
