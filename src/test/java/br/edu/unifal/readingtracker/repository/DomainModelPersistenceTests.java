package br.edu.unifal.readingtracker.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

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
import jakarta.persistence.PersistenceException;

/** Entities, relationships and repository queries against a real (in-memory) H2 database. */
@DataJpaTest
class DomainModelPersistenceTests {

	@Autowired
	TestEntityManager em;

	@Autowired
	AuthorRepository authors;

	@Autowired
	ThemeRepository themes;

	@Autowired
	BookRepository books;

	@Autowired
	ReadingRepository readings;

	@Autowired
	CountryRepository countries;

	private Country usa;
	private Author ziblatt;
	private Author levitsky;
	private Theme politics;
	private Theme democracy;

	@BeforeEach
	void createReferenceData() {
		usa = em.persist(new Country("United States"));
		// Persisted in reverse order on purpose, to prove the book keeps its own author order
		ziblatt = em.persist(withCountry(new Author("Daniel Ziblatt"), usa));
		levitsky = em.persist(withCountry(new Author("Steven Levitsky"), usa));
		politics = em.persist(new Theme("Politics"));
		democracy = em.persist(new Theme("Democracy"));
	}

	@Test
	void bookKeepsAuthorsThemesAndReadings() {
		Book book = new Book("Como as Democracias Morrem");
		book.setAuthors(List.of(levitsky, ziblatt));
		book.setThemes(List.of(politics, democracy));
		book.setPublicationYear(2018);
		book.setForm(BookForm.ESSAY);
		book.setMode(ExpressionMode.PROSE);
		book.setContent(ContentType.NON_FICTION);
		Long bookId = em.persistAndGetId(book, Long.class);

		Reading first = read(book, 2023, 7.5);
		Reading reread = read(book, 2026, 8.5);
		em.persist(first);
		em.persist(reread);
		em.flush();
		em.clear();

		Book saved = books.findById(bookId).orElseThrow();
		assertThat(saved.getAuthors()).extracting(Author::getName)
				.containsExactly("Steven Levitsky", "Daniel Ziblatt");
		assertThat(saved.getThemes()).extracting(Theme::getName).containsExactly("Politics", "Democracy");
		assertThat(saved.getForm()).isEqualTo(BookForm.ESSAY);
		assertThat(saved.getMode()).isEqualTo(ExpressionMode.PROSE);
		assertThat(saved.getContent()).isEqualTo(ContentType.NON_FICTION);

		List<Reading> bookReadings = readings.findByBook_IdOrderByIdAsc(bookId);
		assertThat(bookReadings).extracting(Reading::getYearRead).containsExactly(2023, 2026);
		assertThat(bookReadings).extracting(Reading::getGrade).containsExactly(7.5, 8.5);
		assertThat(bookReadings).allSatisfy(reading -> assertThat(reading.getBook().getId()).isEqualTo(bookId));
	}

	@Test
	void bookCanBeSavedWithOnlyItsTitle() {
		Long id = em.persistAndGetId(new Book("O Homem sem Qualidades"), Long.class);
		em.flush();
		em.clear();

		Book saved = books.findById(id).orElseThrow();
		assertThat(saved.getAuthors()).isEmpty();
		assertThat(saved.getThemes()).isEmpty();
		assertThat(saved.getPublicationYear()).isNull();
		assertThat(saved.getForm()).isNull();
		assertThat(saved.getMode()).isNull();
		assertThat(saved.getContent()).isNull();
	}

	@Test
	void negativePublicationYearMeansBc() {
		Book oedipus = new Book("Édipo Rei");
		oedipus.setPublicationYear(-429);
		Long id = em.persistAndGetId(oedipus, Long.class);
		em.flush();
		em.clear();

		assertThat(books.findById(id).orElseThrow().getPublicationYear()).isEqualTo(-429);
	}

	@Test
	void authorKeepsOptionalCountryAndDates() {
		Author dostoevsky = new Author("Fyodor Dostoevsky");
		dostoevsky.setBirthDate(LocalDate.of(1821, 11, 11));
		dostoevsky.setDeathDate(LocalDate.of(1881, 2, 9));
		Long withDates = em.persistAndGetId(dostoevsky, Long.class);
		Long withoutCountry = em.persistAndGetId(new Author("Luiz Theodoro"), Long.class);
		em.flush();
		em.clear();

		Author saved = authors.findById(withDates).orElseThrow();
		assertThat(saved.getBirthDate()).isEqualTo("1821-11-11");
		assertThat(saved.getDeathDate()).isEqualTo("1881-02-09");
		assertThat(authors.findById(withoutCountry).orElseThrow().getCountry()).isNull();
		assertThat(authors.findById(ziblatt.getId()).orElseThrow().getCountry().getName()).isEqualTo("United States");
	}

	/**
	 * Regression: before 1914 America/Sao_Paulo used local mean time (-03:06:28) and dates went
	 * through java.sql.Date came back one day earlier (1821-11-11 became 1821-11-10).
	 * These are the birth/death dates found in seed.json.
	 */
	@Test
	void historicalSeedDatesAreStoredExactly() {
		List<String> seedDates = List.of("1799-06-06", "1837-02-10", "1809-04-01", "1852-03-04", "1818-11-09",
				"1883-09-03", "1821-11-11", "1881-02-09", "1828-09-09", "1910-11-20", "1860-01-29", "1904-07-15",
				"1891-05-15", "1940-03-10", "1920-01-02", "1992-04-06");

		for (String date : seedDates) {
			Author author = new Author("Author born " + date);
			author.setBirthDate(LocalDate.parse(date));
			Long id = em.persistAndGetId(author, Long.class);
			em.flush();
			em.clear();

			assertThat(authors.findById(id).orElseThrow().getBirthDate()).as("entity value").hasToString(date);
			Object stored = em.getEntityManager()
					.createNativeQuery("SELECT CAST(birth_date AS VARCHAR) FROM authors WHERE id = :id")
					.setParameter("id", id).getSingleResult();
			assertThat(stored).as("database column").isEqualTo(date);
		}
	}

	@Test
	void wishlistReadingKeepsPriorityRecommendationAndNotes() {
		Book book = em.persist(new Book("Rites of Passage"));
		Reading wish = new Reading(book, ReadingStatus.WANT_TO_READ);
		wish.setPriority(Priority.HIGH);
		wish.setRecommendedBy("Teco");
		wish.setNotes("x".repeat(5_000));
		Long id = em.persistAndGetId(wish, Long.class);
		em.flush();
		em.clear();

		Reading saved = readings.findById(id).orElseThrow();
		assertThat(saved.getStatus()).isEqualTo(ReadingStatus.WANT_TO_READ);
		assertThat(saved.getPriority()).isEqualTo(Priority.HIGH);
		assertThat(saved.getRecommendedBy()).isEqualTo("Teco");
		assertThat(saved.getNotes()).hasSize(5_000);
		assertThat(saved.getYearRead()).isNull();
		assertThat(saved.getGrade()).isNull();
	}

	@Test
	void controlledValuesAreStoredWithTheirOfficialSpelling() {
		Book book = new Book("Olhos d'Água");
		book.setForm(BookForm.SHORT_STORY_COLLECTION);
		book.setMode(ExpressionMode.SEQUENTIAL_ART);
		book.setContent(ContentType.NON_FICTION);
		em.persist(book);
		Reading reading = new Reading(book, ReadingStatus.WANT_TO_READ);
		reading.setPriority(Priority.MEDIUM);
		em.persist(reading);
		em.flush();

		Object[] bookRow = (Object[]) em.getEntityManager()
				.createNativeQuery("SELECT form, mode, content FROM books WHERE id = :id")
				.setParameter("id", book.getId()).getSingleResult();
		Object[] readingRow = (Object[]) em.getEntityManager()
				.createNativeQuery("SELECT status, priority FROM readings WHERE id = :id")
				.setParameter("id", reading.getId()).getSingleResult();

		assertThat(bookRow).containsExactly("Short Story Collection", "Sequential Art", "Non-fiction");
		assertThat(readingRow).containsExactly("Want to read", "Medium");
	}

	@Test
	void readingRequiresABook() {
		assertThatThrownBy(() -> em.persistAndFlush(new Reading(null, ReadingStatus.READ)))
				.isInstanceOf(PersistenceException.class);
	}

	@Test
	void readingRequiresAStatus() {
		Book book = em.persist(new Book("Stoner"));
		assertThatThrownBy(() -> em.persistAndFlush(new Reading(book, null)))
				.isInstanceOf(PersistenceException.class);
	}

	@Test
	void nameDuplicateChecksIgnoreCase() {
		assertThat(authors.existsByNameIgnoreCase("steven LEVITSKY")).isTrue();
		assertThat(authors.existsByNameIgnoreCase("Steven Pinker")).isFalse();
		assertThat(authors.existsByNameIgnoreCaseAndIdNot("STEVEN LEVITSKY", levitsky.getId())).isFalse();
		assertThat(authors.existsByNameIgnoreCaseAndIdNot("STEVEN LEVITSKY", ziblatt.getId())).isTrue();

		assertThat(themes.existsByNameIgnoreCase("POLITICS")).isTrue();
		assertThat(themes.existsByNameIgnoreCase("Gothic")).isFalse();
	}

	@Test
	void findsBooksLinkedToAnAuthor() {
		Book first = new Book("Como as Democracias Morrem");
		first.setAuthors(List.of(levitsky, ziblatt));
		Book second = new Book("Competitive Authoritarianism");
		second.setAuthors(List.of(levitsky));
		em.persist(first);
		em.persist(second);
		em.persist(new Book("Sem autor"));
		em.flush();

		assertThat(books.findByAuthors_IdOrderByIdAsc(levitsky.getId())).extracting(Book::getTitle)
				.containsExactly("Como as Democracias Morrem", "Competitive Authoritarianism");
		assertThat(books.findByAuthors_IdOrderByIdAsc(ziblatt.getId())).extracting(Book::getTitle)
				.containsExactly("Como as Democracias Morrem");
	}

	@Test
	void readingQueriesSupportCascadeDeleteAndYearRule() {
		Book book = em.persist(new Book("The Idiot"));
		Book other = em.persist(new Book("Stoner"));
		em.persist(read(book, 2024, 8.0));
		em.persist(read(book, 2026, 9.0));
		em.persist(new Reading(book, ReadingStatus.PAUSED));
		Reading otherReading = em.persist(read(other, 2025, 8.0));
		em.flush();

		assertThat(readings.countByBook_Id(book.getId())).isEqualTo(3);
		// Publication year 2025 would be later than the 2024 reading; 2024 would not
		assertThat(readings.existsByBook_IdAndYearReadLessThan(book.getId(), 2025)).isTrue();
		assertThat(readings.existsByBook_IdAndYearReadLessThan(book.getId(), 2024)).isFalse();

		readings.deleteByBook_Id(book.getId());
		em.flush();
		em.clear();

		assertThat(readings.countByBook_Id(book.getId())).isZero();
		assertThat(readings.findAllByOrderByIdAsc()).extracting(Reading::getId).containsExactly(otherReading.getId());
	}

	@Test
	void listsAreOrderedById() {
		em.persist(new Country("Brazil"));
		em.flush();

		assertThat(countries.findAllByOrderByIdAsc()).extracting(Country::getName)
				.containsExactly("United States", "Brazil");
		assertThat(authors.findAllByOrderByIdAsc()).extracting(Author::getName)
				.containsExactly("Daniel Ziblatt", "Steven Levitsky");
		assertThat(themes.findAllByOrderByIdAsc()).extracting(Theme::getName).containsExactly("Politics", "Democracy");
	}

	private static Author withCountry(Author author, Country country) {
		author.setCountry(country);
		return author;
	}

	private static Reading read(Book book, int year, double grade) {
		Reading reading = new Reading(book, ReadingStatus.READ);
		reading.setYearRead(year);
		reading.setGrade(grade);
		return reading;
	}

}
