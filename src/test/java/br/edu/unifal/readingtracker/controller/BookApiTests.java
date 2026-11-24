package br.edu.unifal.readingtracker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Year;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import br.edu.unifal.readingtracker.config.ClockConfig;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.Reading;
import br.edu.unifal.readingtracker.model.ReadingStatus;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.repository.ThemeRepository;
import br.edu.unifal.readingtracker.seed.SeedLoader;

/** /api/books: FR-02 (CRUD, existing authors/themes), FR-03 (cascade), FR-06 and Section 4 book rules. */
@SpringBootTest
@AutoConfigureMockMvc
class BookApiTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	SeedLoader seedLoader;

	@Autowired
	BookRepository books;

	@Autowired
	AuthorRepository authors;

	@Autowired
	ThemeRepository themes;

	@Autowired
	ReadingRepository readings;

	@Autowired
	JdbcTemplate jdbc;

	@BeforeEach
	void loadSeed() {
		seedLoader.clear();
		seedLoader.load();
	}

	// ---------- read ----------

	@Test
	void listsTheSeedBooksInSeedShape() throws Exception {
		mvc.perform(get("/api/books"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(143)))
				.andExpect(jsonPath("$[0].title").value("Dom Quixote (adaptação)"))
				.andExpect(jsonPath("$[0].length()").value(8))
				.andExpect(jsonPath("$[4].title").value("Édipo Rei"))
				.andExpect(jsonPath("$[4].publicationYear").value(-429))
				.andExpect(jsonPath("$[42].title").value("Como as Democracias Morrem"))
				.andExpect(jsonPath("$[42].authorIds",
						contains((int) authorId("Steven Levitsky"), (int) authorId("Daniel Ziblatt"))))
				.andExpect(jsonPath("$[101].form").value("Essay"))
				.andExpect(jsonPath("$[101].mode").value("Prose"))
				.andExpect(jsonPath("$[101].content").value("Non-fiction"))
				.andExpect(jsonPath("$[101].themeIds", hasSize(5)))
				.andExpect(jsonPath("$[142].authorIds", empty()));
	}

	@Test
	void getsOneBookAndReportsUnknownOrInvalidId() throws Exception {
		mvc.perform(get("/api/books/" + bookId("Stoner")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("Stoner"))
				.andExpect(jsonPath("$.publicationYear").value(1965));
		expectError(mvc.perform(get("/api/books/999999")), 404, "Record not found.");
		expectFieldError(mvc.perform(get("/api/books/abc")), "id", "Use a positive integer ID.");
	}

	// ---------- create ----------

	@Test
	void createsBookWithOnlyItsTitle() throws Exception {
		String location = postBook("{\"title\": \"  O Homem sem Qualidades  \"}")
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", matchesPattern("/api/books/\\d+")))
				.andExpect(jsonPath("$.title").value("O Homem sem Qualidades"))
				.andExpect(jsonPath("$.authorIds", empty()))
				.andExpect(jsonPath("$.themeIds", empty()))
				.andExpect(jsonPath("$.publicationYear").value(nullValue()))
				.andExpect(jsonPath("$.form").value(nullValue()))
				.andExpect(jsonPath("$.mode").value(nullValue()))
				.andExpect(jsonPath("$.content").value(nullValue()))
				.andReturn().getResponse().getHeader("Location");

		mvc.perform(get(location)).andExpect(status().isOk());
		assertThat(books.count()).isEqualTo(144);
	}

	@Test
	void createsCompleteBookKeepingAuthorAndThemeOrder() throws Exception {
		long ziblatt = authorId("Daniel Ziblatt");
		long levitsky = authorId("Steven Levitsky");
		long politics = themeId("Politics");
		long history = themeId("History");
		postBook("{\"title\": \"Tyranny of the Minority\", \"authorIds\": [" + ziblatt + ", " + levitsky + "], "
				+ "\"publicationYear\": 2023, \"form\": \"Essay\", \"mode\": \"Prose\", \"content\": \"Non-fiction\", "
				+ "\"themeIds\": [" + history + ", " + politics + "]}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.authorIds", contains((int) ziblatt, (int) levitsky)))
				.andExpect(jsonPath("$.themeIds", contains((int) history, (int) politics)))
				.andExpect(jsonPath("$.publicationYear").value(2023))
				.andExpect(jsonPath("$.form").value("Essay"))
				.andExpect(jsonPath("$.mode").value("Prose"))
				.andExpect(jsonPath("$.content").value("Non-fiction"));
	}

	@Test
	void titleIsRequiredAndLimited() throws Exception {
		for (String body : new String[] { "{}", "{\"title\": null}", "{\"title\": \"  \"}" }) {
			expectFieldError(postBook(body), "title", "This field is required.");
		}
		expectFieldError(postBook("{\"title\": \"" + "x".repeat(Book.TITLE_MAX_LENGTH + 1) + "\"}"),
				"title", "Use at most 500 characters.");
	}

	@Test
	void negativeYearMeansBcAndIsAccepted() throws Exception {
		postBook("{\"title\": \"Antígona\", \"publicationYear\": -441}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.publicationYear").value(-441));
	}

	@Test
	void yearZeroAndFutureYearsAreRejected() throws Exception {
		int currentYear = Year.now(ClockConfig.ZONE).getValue();
		for (int year : new int[] { 0, currentYear + 1, 9999 }) {
			expectFieldError(postBook("{\"title\": \"X\", \"publicationYear\": " + year + "}"), "publicationYear",
					"Publication year cannot be zero or in the future.");
		}
		postBook("{\"title\": \"This Year\", \"publicationYear\": " + currentYear + "}").andExpect(status().isCreated());
	}

	@Test
	void yearMustBeAWholeNumber() throws Exception {
		expectFieldError(postBook("{\"title\": \"X\", \"publicationYear\": 1965.5}"), "publicationYear",
				"Enter a whole number.");
		expectFieldError(postBook("{\"title\": \"X\", \"publicationYear\": \"sixties\"}"), "publicationYear",
				"Enter a whole number.");
	}

	@Test
	void authorIdsMustBeExistingAndWithoutDuplicates() throws Exception {
		long weir = authorId("Andy Weir");
		for (String ids : new String[] { "[" + weir + ", " + weir + "]", "[999999]", "[" + weir + ", null]" }) {
			expectFieldError(postBook("{\"title\": \"X\", \"authorIds\": " + ids + "}"), "authorIds",
					"Choose a list of existing records without duplicates.");
		}
		expectFieldError(postBook("{\"title\": \"X\", \"authorIds\": [\"Andy Weir\"]}"), "authorIds",
				"Enter a whole number.");
		expectFieldError(postBook("{\"title\": \"X\", \"authorIds\": 5}"), "authorIds",
				"Choose a list of existing records without duplicates.");
		assertThat(books.count()).isEqualTo(143);
	}

	@Test
	void themeIdsMustBeExistingAndWithoutDuplicates() throws Exception {
		long gothic = themeId("Gothic");
		for (String ids : new String[] { "[" + gothic + ", " + gothic + "]", "[999999]" }) {
			expectFieldError(postBook("{\"title\": \"X\", \"themeIds\": " + ids + "}"), "themeIds",
					"Choose a list of existing records without duplicates.");
		}
	}

	@Test
	void controlledValuesMustUseTheOfficialSpelling() throws Exception {
		expectFieldError(postBook("{\"title\": \"X\", \"form\": \"Romance\"}"), "form", "Choose a value from the list.");
		expectFieldError(postBook("{\"title\": \"X\", \"form\": \"novel\"}"), "form", "Choose a value from the list.");
		expectFieldError(postBook("{\"title\": \"X\", \"mode\": \"Prosa\"}"), "mode", "Choose a value from the list.");
		expectFieldError(postBook("{\"title\": \"X\", \"content\": \"Ficção\"}"), "content",
				"Choose a value from the list.");
		postBook("{\"title\": \"Empty Selects\", \"form\": \"\", \"mode\": \"\", \"content\": \"\"}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.form").value(nullValue()));
	}

	@Test
	void reportsEveryInvalidFieldAtOnce() throws Exception {
		postBook("{\"id\": 1, \"title\": \"\", \"authorIds\": [999999], \"publicationYear\": 0, \"form\": \"Romance\", "
				+ "\"mode\": \"Prosa\", \"content\": \"Ficção\", \"themeIds\": [999999]}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[*].field").value(contains("id", "title", "authorIds",
						"publicationYear", "form", "mode", "content", "themeIds")));
		assertThat(books.count()).isEqualTo(143);
	}

	// ---------- update ----------

	@Test
	void updatesTheWholeRecord() throws Exception {
		long id = bookId("Knulp");
		long hesse = authorId("Hermann Hesse");
		long gothic = themeId("Gothic");
		putBook(id, "{\"id\": " + id + ", \"title\": \"Knulp\", \"authorIds\": [" + hesse + "], \"publicationYear\": 1915, "
				+ "\"form\": \"Novella\", \"mode\": \"Prose\", \"content\": \"Fiction\", \"themeIds\": [" + gothic + "]}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.publicationYear").value(1915))
				.andExpect(jsonPath("$.form").value("Novella"))
				.andExpect(jsonPath("$.themeIds", contains((int) gothic)));

		mvc.perform(get("/api/books/" + id))
				.andExpect(jsonPath("$.publicationYear").value(1915))
				.andExpect(jsonPath("$.themeIds", contains((int) gothic)));
	}

	@Test
	void omittedFieldsAreClearedAndListsEmptied() throws Exception {
		long id = bookId("Como as Democracias Morrem");
		putBook(id, "{\"title\": \"Como as Democracias Morrem\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.authorIds", empty()))
				.andExpect(jsonPath("$.publicationYear").value(nullValue()));
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM book_authors WHERE book_id = ?", Integer.class, id)).isZero();
	}

	@Test
	void publicationYearCannotBeLaterThanAnExistingReading() throws Exception {
		// Sapiens: published 2011, read in 2021
		long id = bookId("Sapiens");
		expectFieldError(putBook(id, "{\"title\": \"Sapiens\", \"publicationYear\": 2022}"), "publicationYear",
				"Publication year cannot be later than the year of an existing reading.");
		putBook(id, "{\"title\": \"Sapiens\", \"publicationYear\": 2021}").andExpect(status().isOk());
		mvc.perform(get("/api/books/" + id)).andExpect(jsonPath("$.publicationYear").value(2021));
	}

	@Test
	void readingsWithoutYearDoNotLimitThePublicationYear() throws Exception {
		// Sátántangó has only a Paused reading (no year read)
		putBook(bookId("Sátántangó"), "{\"title\": \"Sátántangó\", \"publicationYear\": 2025}")
				.andExpect(status().isOk());
	}

	@Test
	void invalidUpdateChangesNothing() throws Exception {
		long id = bookId("Stoner");
		expectFieldError(putBook(id, "{\"title\": \"Stoner\", \"form\": \"Romance\"}"), "form",
				"Choose a value from the list.");
		mvc.perform(get("/api/books/" + id))
				.andExpect(jsonPath("$.form").value("Novel"))
				.andExpect(jsonPath("$.publicationYear").value(1965));
	}

	@Test
	void bodyIdMustMatchTheUrlAndUnknownBookIs404() throws Exception {
		long id = bookId("Stoner");
		expectFieldError(putBook(id, "{\"id\": " + (id + 1) + ", \"title\": \"Stoner\"}"), "id",
				"The ID in the request body must match the ID in the URL.");
		expectError(putBook(999999L, "{\"title\": \"Nobody\"}"), 404, "Record not found.");
	}

	// ---------- delete ----------

	@Test
	void deletingABookAlsoDeletesItsReadings() throws Exception {
		long id = bookId("Stoner");
		Book stoner = books.findById(id).orElseThrow();
		Reading reread = new Reading(stoner, ReadingStatus.READ);
		reread.setYearRead(2026);
		readings.save(reread);
		assertThat(readings.countByBook_Id(id)).isEqualTo(2);

		mvc.perform(delete("/api/books/" + id)).andExpect(status().isNoContent());

		expectError(mvc.perform(get("/api/books/" + id)), 404, "Record not found.");
		assertThat(readings.countByBook_Id(id)).isZero();
		assertThat(readings.count()).isEqualTo(142);
		assertThat(books.count()).isEqualTo(142);
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM book_authors WHERE book_id = ?", Integer.class, id)).isZero();
		assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM book_themes WHERE book_id = ?", Integer.class, id)).isZero();
	}

	@Test
	void afterDeletingItsOnlyBookTheAuthorCanBeDeleted() throws Exception {
		long weir = authorId("Andy Weir");
		mvc.perform(delete("/api/authors/" + weir)).andExpect(status().isConflict());

		mvc.perform(delete("/api/books/" + bookId("Devoradores de Estrelas"))).andExpect(status().isNoContent());

		mvc.perform(delete("/api/authors/" + weir)).andExpect(status().isNoContent());
	}

	@Test
	void deletingUnknownBookIs404() throws Exception {
		expectError(mvc.perform(delete("/api/books/999999")), 404, "Record not found.");
	}

	// ---------- helpers ----------

	private ResultActions postBook(String json) throws Exception {
		return mvc.perform(post("/api/books").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private ResultActions putBook(long id, String json) throws Exception {
		return mvc.perform(put("/api/books/" + id).contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private long bookId(String title) {
		return books.findAllByOrderByIdAsc().stream().filter(book -> book.getTitle().equals(title))
				.findFirst().orElseThrow().getId();
	}

	private long authorId(String name) {
		return authors.findAllByOrderByIdAsc().stream().filter(author -> author.getName().equals(name))
				.findFirst().orElseThrow().getId();
	}

	private long themeId(String name) {
		return themes.findAllByOrderByIdAsc().stream().filter(theme -> theme.getName().equals(name))
				.findFirst().orElseThrow().getId();
	}

	private static void expectError(ResultActions result, int status, String message) throws Exception {
		result.andExpect(status().is(status))
				.andExpect(jsonPath("$.status").value(status))
				.andExpect(jsonPath("$.message").value(message))
				.andExpect(jsonPath("$.errors", hasSize(0)));
	}

	private static void expectFieldError(ResultActions result, String field, String message) throws Exception {
		result.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.message").value("Validation failed"))
				.andExpect(jsonPath("$.errors", hasSize(1)))
				.andExpect(jsonPath("$.errors[0].field").value(field))
				.andExpect(jsonPath("$.errors[0].message").value(message));
	}

}
