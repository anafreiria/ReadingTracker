package br.edu.unifal.readingtracker.service;

import java.time.Clock;
import java.time.Year;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import br.edu.unifal.readingtracker.config.ValidationMessages;
import br.edu.unifal.readingtracker.dto.BookDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.exception.ValidationErrors;
import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.BookForm;
import br.edu.unifal.readingtracker.model.ContentType;
import br.edu.unifal.readingtracker.model.ExpressionMode;
import br.edu.unifal.readingtracker.model.Theme;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.repository.ThemeRepository;

/**
 * Book rules (assignment Section 4), checked on the server even if the browser already did
 * (Section 7). Mirrors {@code validateBook} in frontend/js/validation.js:
 *
 * <ul>
 * <li>title required; everything else optional (a book may be saved with only its title);</li>
 * <li>authors and themes selected from existing records, without duplicates;</li>
 * <li>publication year not in the future; negative means BC; year 0 is invalid;</li>
 * <li>form, mode and content chosen from their lists;</li>
 * <li>when editing, the publication year cannot be later than the year of an existing reading.</li>
 * </ul>
 */
@Component
public class BookValidator {

	private final AuthorRepository authorRepository;
	private final ThemeRepository themeRepository;
	private final ReadingRepository readingRepository;
	private final Clock clock;

	public BookValidator(AuthorRepository authorRepository, ThemeRepository themeRepository,
			ReadingRepository readingRepository, Clock clock) {
		this.authorRepository = authorRepository;
		this.themeRepository = themeRepository;
		this.readingRepository = readingRepository;
		this.clock = clock;
	}

	/** Validated values, ready to be copied into a {@link Book}. */
	public record ValidBook(String title, List<Author> authors, Integer publicationYear, BookForm form,
			ExpressionMode mode, ContentType content, List<Theme> themes) {
	}

	/**
	 * @param currentId id of the book being edited, or {@code null} when creating
	 * @throws ApiException 400 with every invalid field
	 */
	public ValidBook validate(BookDto input, Long currentId) {
		ValidationErrors errors = new ValidationErrors();

		if (currentId == null && input.id() != null) {
			errors.add("id", ValidationMessages.CREATE_ONLY);
		} else if (currentId != null && input.id() != null && !input.id().equals(currentId)) {
			errors.add("id", ValidationMessages.ID_MISMATCH);
		}

		String title = input.title() == null ? "" : input.title().trim();
		if (title.isEmpty()) {
			errors.add("title", ValidationMessages.REQUIRED);
		} else if (title.length() > Book.TITLE_MAX_LENGTH) {
			errors.add("title", ValidationMessages.tooLong(Book.TITLE_MAX_LENGTH));
		}

		List<Author> authors = references(input.authorIds(), authorRepository, Author::getId, "authorIds", errors);

		Integer year = input.publicationYear();
		if (year != null) {
			if (year == 0 || year > Year.now(clock).getValue()) {
				errors.add("publicationYear", ValidationMessages.PUBLICATION);
			} else if (currentId != null && readingRepository.existsByBook_IdAndYearReadLessThan(currentId, year)) {
				errors.add("publicationYear", ValidationMessages.EXISTING_READINGS);
			}
		}

		BookForm form = choice(input.form(), BookForm::fromLabel, "form", errors);
		ExpressionMode mode = choice(input.mode(), ExpressionMode::fromLabel, "mode", errors);
		ContentType content = choice(input.content(), ContentType::fromLabel, "content", errors);

		List<Theme> themes = references(input.themeIds(), themeRepository, Theme::getId, "themeIds", errors);

		errors.throwIfAny();
		return new ValidBook(title, authors, year, form, mode, content, themes);
	}

	/**
	 * Resolves ids to existing records, keeping the order the user chose. A missing list means
	 * "none"; a null, repeated or unknown id makes the whole list invalid.
	 */
	private static <T> List<T> references(List<Long> ids, JpaRepository<T, Long> repository,
			Function<T, Long> idOf, String field, ValidationErrors errors) {
		if (ids == null || ids.isEmpty()) {
			return List.of();
		}
		if (ids.contains(null) || new HashSet<>(ids).size() != ids.size()) {
			errors.add(field, ValidationMessages.LIST);
			return List.of();
		}
		Map<Long, T> found = repository.findAllById(ids).stream()
				.collect(Collectors.toMap(idOf, Function.identity()));
		if (found.size() != ids.size()) {
			errors.add(field, ValidationMessages.LIST);
			return List.of();
		}
		return ids.stream().map(found::get).toList();
	}

	/** Empty or missing means "not set"; anything else must be one of the official labels. */
	private static <E> E choice(String value, Function<String, Optional<E>> fromLabel, String field,
			ValidationErrors errors) {
		if (value == null || value.isEmpty()) {
			return null;
		}
		Optional<E> choice = fromLabel.apply(value);
		if (choice.isEmpty()) {
			errors.add(field, ValidationMessages.SELECTION);
		}
		return choice.orElse(null);
	}

}
