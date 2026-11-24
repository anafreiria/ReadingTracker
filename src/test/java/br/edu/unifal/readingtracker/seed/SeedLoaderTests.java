package br.edu.unifal.readingtracker.seed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.Country;
import br.edu.unifal.readingtracker.model.LabeledEnum;
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

/** Loading seed.json (assignment Section 7, Persistence step 4, and Section 11). */
@SpringBootTest
class SeedLoaderTests {

	@Autowired
	SeedLoader loader;

	@Autowired
	CountryRepository countries;

	@Autowired
	ThemeRepository themes;

	@Autowired
	AuthorRepository authors;

	@Autowired
	BookRepository books;

	@Autowired
	ReadingRepository readings;

	@Autowired
	JdbcTemplate jdbc;

	@BeforeEach
	@AfterEach
	void startWithEmptyDatabase() {
		loader.clear();
	}

	@Test
	void loadsEveryRecordOfTheOfficialSeed() {
		SeedSummary summary = loader.load();

		// Counts of the actual file (the guide says 132 themes; the file has 135)
		assertThat(summary).isEqualTo(new SeedSummary(27, 135, 101, 143, 143));
		assertThat(countries.count()).isEqualTo(27);
		assertThat(themes.count()).isEqualTo(135);
		assertThat(authors.count()).isEqualTo(101);
		assertThat(books.count()).isEqualTo(143);
		assertThat(readings.count()).isEqualTo(143);
		assertThat(readings.findAll()).extracting(Reading::getStatus)
				.filteredOn(ReadingStatus.READ::equals).hasSize(115);
		assertThat(readings.findAll()).extracting(Reading::getStatus)
				.filteredOn(ReadingStatus.PAUSED::equals).hasSize(12);
		assertThat(readings.findAll()).extracting(Reading::getStatus)
				.filteredOn(ReadingStatus.WANT_TO_READ::equals).hasSize(16);
	}

	/** Every field of every record, including the references between collections. */
	@Test
	@Transactional
	void savedDataMatchesSeedFileExactly() {
		SeedData seed = loader.read();
		loader.load(seed);

		List<Country> savedCountries = countries.findAllByOrderByIdAsc();
		List<Theme> savedThemes = themes.findAllByOrderByIdAsc();
		List<Author> savedAuthors = authors.findAllByOrderByIdAsc();
		List<Book> savedBooks = books.findAllByOrderByIdAsc();
		List<Reading> savedReadings = readings.findAllByOrderByIdAsc();

		// Records are inserted in file order, so the n-th saved record is the n-th seed record
		Map<Long, Long> countrySeedId = seedIds(savedCountries, Country::getId, seed.countries(), SeedCountry::id);
		Map<Long, Long> themeSeedId = seedIds(savedThemes, Theme::getId, seed.themes(), SeedTheme::id);
		Map<Long, Long> authorSeedId = seedIds(savedAuthors, Author::getId, seed.authors(), SeedAuthor::id);
		Map<Long, Long> bookSeedId = seedIds(savedBooks, Book::getId, seed.books(), SeedBook::id);
		seedIds(savedReadings, Reading::getId, seed.readings(), SeedReading::id);

		for (int i = 0; i < savedCountries.size(); i++) {
			assertThat(savedCountries.get(i).getName()).isEqualTo(seed.countries().get(i).name());
		}
		for (int i = 0; i < savedThemes.size(); i++) {
			assertThat(savedThemes.get(i).getName()).isEqualTo(seed.themes().get(i).name());
		}
		for (int i = 0; i < savedAuthors.size(); i++) {
			Author saved = savedAuthors.get(i);
			SeedAuthor expected = seed.authors().get(i);
			assertThat(saved.getName()).isEqualTo(expected.name());
			assertThat(saved.getCountry() == null ? null : countrySeedId.get(saved.getCountry().getId()))
					.as("countryId of %s", expected.name()).isEqualTo(expected.countryId());
			assertThat(text(saved.getBirthDate())).isEqualTo(expected.birthDate());
			assertThat(text(saved.getDeathDate())).isEqualTo(expected.deathDate());
		}
		for (int i = 0; i < savedBooks.size(); i++) {
			Book saved = savedBooks.get(i);
			SeedBook expected = seed.books().get(i);
			assertThat(saved.getTitle()).isEqualTo(expected.title());
			assertThat(saved.getAuthors()).extracting(author -> authorSeedId.get(author.getId()))
					.as("authorIds of %s", expected.title()).containsExactlyElementsOf(expected.authorIds());
			assertThat(saved.getPublicationYear()).isEqualTo(expected.publicationYear());
			assertThat(label(saved.getForm())).isEqualTo(expected.form());
			assertThat(label(saved.getMode())).isEqualTo(expected.mode());
			assertThat(label(saved.getContent())).isEqualTo(expected.content());
			assertThat(saved.getThemes()).extracting(theme -> themeSeedId.get(theme.getId()))
					.as("themeIds of %s", expected.title()).containsExactlyElementsOf(expected.themeIds());
		}
		for (int i = 0; i < savedReadings.size(); i++) {
			Reading saved = savedReadings.get(i);
			SeedReading expected = seed.readings().get(i);
			assertThat(bookSeedId.get(saved.getBook().getId())).as("bookId of reading %s", expected.id())
					.isEqualTo(expected.bookId());
			assertThat(saved.getStatus().label()).isEqualTo(expected.status());
			assertThat(saved.getYearRead()).isEqualTo(expected.yearRead());
			assertThat(saved.getGrade()).isEqualTo(expected.grade());
			assertThat(saved.getRecommendedBy()).isEqualTo(expected.recommendedBy());
			assertThat(label(saved.getPriority())).isEqualTo(expected.priority());
			assertThat(saved.getNotes()).isEqualTo(expected.notes());
		}
	}

	@Test
	@Transactional
	void keepsTheIncompleteAndSpecialRecordsOfTheLog() {
		loader.load();
		List<Book> all = books.findAllByOrderByIdAsc();

		assertThat(all).filteredOn(book -> book.getAuthors().isEmpty()).extracting(Book::getTitle)
				.containsExactly("Paraíso e Inferno", "O Homem sem Qualidades");
		assertThat(all).filteredOn(book -> book.getPublicationYear() == null).hasSize(12);
		assertThat(find(all, "Édipo Rei").getPublicationYear()).isEqualTo(-429);
		assertThat(find(all, "Como as Democracias Morrem").getAuthors()).extracting(Author::getName)
				.containsExactly("Steven Levitsky", "Daniel Ziblatt");

		Author dostoevsky = authors.findAllByOrderByIdAsc().stream()
				.filter(author -> author.getName().equals("Fyodor Dostoevsky")).findFirst().orElseThrow();
		assertThat(dostoevsky.getCountry().getName()).isEqualTo("Russia");
		assertThat(dostoevsky.getBirthDate()).isEqualTo(LocalDate.of(1821, 11, 11));
		assertThat(dostoevsky.getDeathDate()).isEqualTo(LocalDate.of(1881, 2, 9));

		Reading recommended = readings.findByBook_IdOrderByIdAsc(find(all, "Rites of Passage").getId()).getFirst();
		assertThat(recommended.getStatus()).isEqualTo(ReadingStatus.WANT_TO_READ);
		assertThat(recommended.getRecommendedBy()).isEqualTo("Teco");

		Reading ungraded = readings.findByBook_IdOrderByIdAsc(find(all, "The Cook's Wedding").getId()).getFirst();
		assertThat(ungraded.getStatus()).isEqualTo(ReadingStatus.READ);
		assertThat(ungraded.getYearRead()).isEqualTo(2026);
		assertThat(ungraded.getGrade()).isNull();
	}

	@Test
	void databaseIsEmptyOnlyBeforeLoading() {
		assertThat(loader.isDatabaseEmpty()).isTrue();
		loader.load();
		assertThat(loader.isDatabaseEmpty()).isFalse();
	}

	@Test
	void clearDeletesEveryRecordAndLink() {
		loader.load();
		loader.clear();

		assertThat(loader.isDatabaseEmpty()).isTrue();
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM book_authors", Integer.class)).isZero();
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM book_themes", Integer.class)).isZero();
	}

	/**
	 * Reset (Etapa 10) clears and loads in one transaction that may already hold loaded entities.
	 * Bulk deletes would leave those entities pointing to deleted rows and the flush would fail.
	 */
	@Test
	@Transactional
	void clearAndReloadWorkInTheSameTransactionAsLoadedEntities() {
		loader.load();
		assertThat(readings.findAllByOrderByIdAsc().getFirst().getBook().getTitle()).isEqualTo("Dom Quixote (adaptação)");

		loader.clear();
		SeedSummary summary = loader.load();

		assertThat(summary.readings()).isEqualTo(143);
		assertThat(readings.count()).isEqualTo(143);
		assertThat(books.count()).isEqualTo(143);
	}

	/** Assignment Section 7, note on IDs: after a reset the same records come back with new IDs. */
	@Test
	void reloadingGeneratesNewIdsInsteadOfCopyingSeedIds() {
		loader.load();
		long firstMaxAuthorId = maxId(authors.findAllByOrderByIdAsc(), Author::getId);

		loader.clear();
		loader.load();

		List<Author> reloaded = authors.findAllByOrderByIdAsc();
		assertThat(reloaded).hasSize(101);
		assertThat(reloaded.getFirst().getId()).isGreaterThan(firstMaxAuthorId);
	}

	@Test
	void invalidSeedSavesNothing() {
		SeedData invalid = new SeedData(
				List.of(new SeedCountry(1L, "Brazil")),
				List.of(new SeedAuthor(1L, "Lima Barreto", 1L, null, null)),
				List.of(),
				List.of(new SeedBook(1L, "O Homem que Sabia Javanês", List.of(1L), 1911, "Conto", "Prosa", null,
						List.of())),
				List.of());

		assertThatThrownBy(() -> loader.load(invalid))
				.isInstanceOf(IllegalStateException.class)
				.hasMessage("Invalid seed.json: book 1 form has unknown value 'Conto'");
		assertThat(loader.isDatabaseEmpty()).as("transaction rolled back").isTrue();
	}

	@Test
	void missingReferenceIsReported() {
		SeedData invalid = new SeedData(List.of(), List.of(new SeedAuthor(7L, "Luiz Theodoro", 99L, null, null)),
				List.of(), List.of(), List.of());

		assertThatThrownBy(() -> loader.load(invalid))
				.hasMessage("Invalid seed.json: author 7 countryId refers to missing id 99");
		assertThat(loader.isDatabaseEmpty()).isTrue();
	}

	private static <E, S> Map<Long, Long> seedIds(List<E> saved, Function<E, Long> savedId, List<S> seed,
			Function<S, Long> seedId) {
		assertThat(saved).hasSameSizeAs(seed);
		Map<Long, Long> map = new HashMap<>();
		for (int i = 0; i < saved.size(); i++) {
			map.put(savedId.apply(saved.get(i)), seedId.apply(seed.get(i)));
		}
		return map;
	}

	private static Book find(List<Book> all, String title) {
		return all.stream().filter(book -> book.getTitle().equals(title)).findFirst().orElseThrow();
	}

	private static String label(LabeledEnum value) {
		return value == null ? null : value.label();
	}

	private static String text(LocalDate date) {
		return date == null ? null : date.toString();
	}

	private static <E> long maxId(List<E> records, Function<E, Long> id) {
		return records.stream().map(id).mapToLong(Long::longValue).max().orElseThrow();
	}

}
