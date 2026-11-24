package br.edu.unifal.readingtracker.seed;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.BookForm;
import br.edu.unifal.readingtracker.model.ContentType;
import br.edu.unifal.readingtracker.model.Country;
import br.edu.unifal.readingtracker.model.ExpressionMode;
import br.edu.unifal.readingtracker.model.Priority;
import br.edu.unifal.readingtracker.model.Reading;
import br.edu.unifal.readingtracker.model.ReadingStatus;
import br.edu.unifal.readingtracker.model.Theme;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.CountryRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.repository.ThemeRepository;
import br.edu.unifal.readingtracker.seed.SeedData.SeedAuthor;
import br.edu.unifal.readingtracker.seed.SeedData.SeedBook;
import br.edu.unifal.readingtracker.seed.SeedData.SeedCountry;
import br.edu.unifal.readingtracker.seed.SeedData.SeedReading;
import br.edu.unifal.readingtracker.seed.SeedData.SeedTheme;
import tools.jackson.databind.ObjectMapper;

/**
 * Loads seed.json into the database (assignment Section 7, Persistence, step 4).
 *
 * <ul>
 * <li>Inserts in the order countries, themes, authors, books, readings.</li>
 * <li>Never copies the seed IDs: the database generates them. While inserting, a map from each
 * seed ID to the saved entity turns references such as {@code authorIds} into saved objects.</li>
 * <li>Runs in a single transaction: if any record is invalid, nothing is saved.</li>
 * </ul>
 *
 * The same {@link #clear()} and {@link #load()} are reused by {@code POST /api/reset}.
 */
@Component
public class SeedLoader {

	static final String SEED_LOCATION = "seed.json";

	private final ObjectMapper objectMapper;
	private final CountryRepository countryRepository;
	private final ThemeRepository themeRepository;
	private final AuthorRepository authorRepository;
	private final BookRepository bookRepository;
	private final ReadingRepository readingRepository;

	public SeedLoader(ObjectMapper objectMapper, CountryRepository countryRepository,
			ThemeRepository themeRepository, AuthorRepository authorRepository, BookRepository bookRepository,
			ReadingRepository readingRepository) {
		this.objectMapper = objectMapper;
		this.countryRepository = countryRepository;
		this.themeRepository = themeRepository;
		this.authorRepository = authorRepository;
		this.bookRepository = bookRepository;
		this.readingRepository = readingRepository;
	}

	/** True when no table has any record: the only case in which the seed is loaded at startup. */
	@Transactional(readOnly = true)
	public boolean isDatabaseEmpty() {
		return countryRepository.count() == 0 && themeRepository.count() == 0 && authorRepository.count() == 0
				&& bookRepository.count() == 0 && readingRepository.count() == 0;
	}

	/** Reads seed.json from the classpath ({@code src/main/resources/seed.json}). */
	public SeedData read() {
		Resource resource = new ClassPathResource(SEED_LOCATION);
		try (InputStream input = resource.getInputStream()) {
			return objectMapper.readValue(input, SeedData.class);
		} catch (IOException ex) {
			throw new UncheckedIOException("Could not read " + SEED_LOCATION + " from the classpath", ex);
		}
	}

	/** Loads the official seed.json. */
	@Transactional
	public SeedSummary load() {
		return load(read());
	}

	/** Loads the given data; used by {@link #load()} and by tests. */
	@Transactional
	public SeedSummary load(SeedData seed) {
		Map<Long, Country> countries = new HashMap<>();
		for (SeedCountry item : seed.countries()) {
			countries.put(item.id(), countryRepository.save(new Country(item.name())));
		}

		Map<Long, Theme> themes = new HashMap<>();
		for (SeedTheme item : seed.themes()) {
			themes.put(item.id(), themeRepository.save(new Theme(item.name())));
		}

		Map<Long, Author> authors = new HashMap<>();
		for (SeedAuthor item : seed.authors()) {
			Author author = new Author(item.name());
			author.setCountry(optionalReference(countries, item.countryId(), "author " + item.id(), "countryId"));
			author.setBirthDate(date(item.birthDate(), "author " + item.id(), "birthDate"));
			author.setDeathDate(date(item.deathDate(), "author " + item.id(), "deathDate"));
			authors.put(item.id(), authorRepository.save(author));
		}

		Map<Long, Book> books = new HashMap<>();
		for (SeedBook item : seed.books()) {
			String where = "book " + item.id();
			Book book = new Book(item.title());
			book.setAuthors(references(authors, item.authorIds(), where, "authorIds"));
			book.setPublicationYear(item.publicationYear());
			book.setForm(label(BookForm::fromLabel, item.form(), where, "form"));
			book.setMode(label(ExpressionMode::fromLabel, item.mode(), where, "mode"));
			book.setContent(label(ContentType::fromLabel, item.content(), where, "content"));
			book.setThemes(references(themes, item.themeIds(), where, "themeIds"));
			books.put(item.id(), bookRepository.save(book));
		}

		int readingCount = 0;
		for (SeedReading item : seed.readings()) {
			String where = "reading " + item.id();
			Reading reading = new Reading(
					requiredReference(books, item.bookId(), where, "bookId"),
					label(ReadingStatus::fromLabel, item.status(), where, "status"));
			reading.setYearRead(item.yearRead());
			reading.setGrade(item.grade());
			reading.setRecommendedBy(item.recommendedBy());
			reading.setPriority(label(Priority::fromLabel, item.priority(), where, "priority"));
			reading.setNotes(item.notes());
			readingRepository.save(reading);
			readingCount++;
		}

		return new SeedSummary(countries.size(), themes.size(), authors.size(), books.size(), readingCount);
	}

	/**
	 * Deletes every record, children before parents: readings, books (and their author/theme
	 * links), authors, themes, countries.
	 *
	 * <p>Uses {@code deleteAll()} (removal through JPA) rather than bulk deletes: bulk deletes skip
	 * the persistence context, so entities already loaded in the same transaction would still
	 * reference deleted rows and the flush would fail. Removing books through JPA also clears the
	 * book_authors and book_themes link tables.
	 */
	@Transactional
	public void clear() {
		readingRepository.deleteAll();
		bookRepository.deleteAll();
		authorRepository.deleteAll();
		themeRepository.deleteAll();
		countryRepository.deleteAll();
		countryRepository.flush();
	}

	private static <T> T requiredReference(Map<Long, T> saved, Long seedId, String where, String field) {
		if (seedId == null) {
			throw invalid(where, field, "is required");
		}
		return optionalReference(saved, seedId, where, field);
	}

	private static <T> T optionalReference(Map<Long, T> saved, Long seedId, String where, String field) {
		if (seedId == null) {
			return null;
		}
		T entity = saved.get(seedId);
		if (entity == null) {
			throw invalid(where, field, "refers to missing id " + seedId);
		}
		return entity;
	}

	private static <T> List<T> references(Map<Long, T> saved, List<Long> seedIds, String where, String field) {
		return seedIds.stream().map(id -> requiredReference(saved, id, where, field)).toList();
	}

	private static <E> E label(Function<String, Optional<E>> fromLabel, String value, String where, String field) {
		if (value == null) {
			return null;
		}
		return fromLabel.apply(value).orElseThrow(() -> invalid(where, field, "has unknown value '" + value + "'"));
	}

	private static LocalDate date(String value, String where, String field) {
		if (value == null) {
			return null;
		}
		try {
			return LocalDate.parse(value);
		} catch (DateTimeParseException ex) {
			throw invalid(where, field, "is not a YYYY-MM-DD date: '" + value + "'");
		}
	}

	private static IllegalStateException invalid(String where, String field, String problem) {
		return new IllegalStateException("Invalid " + SEED_LOCATION + ": " + where + " " + field + " " + problem);
	}

}
