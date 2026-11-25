package br.edu.unifal.readingtracker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.function.Function;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.Country;
import br.edu.unifal.readingtracker.model.Reading;
import br.edu.unifal.readingtracker.model.Theme;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.CountryRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.repository.ThemeRepository;
import br.edu.unifal.readingtracker.seed.SeedLoader;

/**
 * {@code POST /api/reset} (FR-07): after the user creates and deletes records, the reset brings
 * back exactly the official seed, with new IDs larger than the previous ones.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ResetApiTests {

	private static final int SEED_COUNTRIES = 27;
	private static final int SEED_THEMES = 135;
	private static final int SEED_AUTHORS = 101;
	private static final int SEED_BOOKS = 143;
	private static final int SEED_READINGS = 143;

	@Autowired
	MockMvc mvc;

	@Autowired
	SeedLoader seedLoader;

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

	@BeforeEach
	void loadSeed() {
		seedLoader.clear();
		seedLoader.load();
	}

	@Test
	void resetRestoresTheSeedAfterUserChanges() throws Exception {
		// user changes: a new author, a new theme and a deleted book (with its readings)
		postJson("/api/authors", "{\"name\": \"Reset Test Author\"}");
		postJson("/api/themes", "{\"name\": \"Reset Test Theme\"}");
		Book deleted = books.findAllByOrderByIdAsc().get(0);
		mvc.perform(delete("/api/books/" + deleted.getId())).andExpect(status().isNoContent());

		assertThat(authors.count()).isEqualTo(SEED_AUTHORS + 1);
		assertThat(themes.count()).isEqualTo(SEED_THEMES + 1);
		assertThat(books.count()).isEqualTo(SEED_BOOKS - 1);

		long maxCountryId = maxId(countries.findAllByOrderByIdAsc(), Country::getId);
		long maxThemeId = maxId(themes.findAllByOrderByIdAsc(), Theme::getId);
		long maxAuthorId = maxId(authors.findAllByOrderByIdAsc(), Author::getId);
		long maxBookId = maxId(books.findAllByOrderByIdAsc(), Book::getId);
		long maxReadingId = maxId(readings.findAllByOrderByIdAsc(), Reading::getId);

		mvc.perform(post("/api/reset"))
				.andExpect(status().isNoContent())
				.andExpect(content().string(""));

		// same counts as the seed
		assertThat(countries.count()).isEqualTo(SEED_COUNTRIES);
		assertThat(themes.count()).isEqualTo(SEED_THEMES);
		assertThat(authors.count()).isEqualTo(SEED_AUTHORS);
		assertThat(books.count()).isEqualTo(SEED_BOOKS);
		assertThat(readings.count()).isEqualTo(SEED_READINGS);

		// nothing created by the user survives, and the deleted book is back
		assertThat(authors.findAllByOrderByIdAsc()).extracting(Author::getName).doesNotContain("Reset Test Author");
		assertThat(themes.findAllByOrderByIdAsc()).extracting(Theme::getName).doesNotContain("Reset Test Theme");
		assertThat(books.findAllByOrderByIdAsc()).extracting(Book::getTitle).contains(deleted.getTitle());

		// IDs are new and larger than every ID that existed before the reset
		assertThat(minId(countries.findAllByOrderByIdAsc(), Country::getId)).isGreaterThan(maxCountryId);
		assertThat(minId(themes.findAllByOrderByIdAsc(), Theme::getId)).isGreaterThan(maxThemeId);
		assertThat(minId(authors.findAllByOrderByIdAsc(), Author::getId)).isGreaterThan(maxAuthorId);
		assertThat(minId(books.findAllByOrderByIdAsc(), Book::getId)).isGreaterThan(maxBookId);
		assertThat(minId(readings.findAllByOrderByIdAsc(), Reading::getId)).isGreaterThan(maxReadingId);
	}

	@Test
	void apiServesTheRestoredDataAfterReset() throws Exception {
		mvc.perform(post("/api/reset")).andExpect(status().isNoContent());

		mvc.perform(get("/api/countries")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(SEED_COUNTRIES));
		mvc.perform(get("/api/themes")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(SEED_THEMES));
		mvc.perform(get("/api/authors")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(SEED_AUTHORS));
		mvc.perform(get("/api/books")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(SEED_BOOKS));
		mvc.perform(get("/api/readings")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(SEED_READINGS));
	}

	@Test
	void resetCanRunTwiceInARow() throws Exception {
		mvc.perform(post("/api/reset")).andExpect(status().isNoContent());
		mvc.perform(post("/api/reset")).andExpect(status().isNoContent());

		assertThat(authors.count()).isEqualTo(SEED_AUTHORS);
		assertThat(books.count()).isEqualTo(SEED_BOOKS);
		assertThat(readings.count()).isEqualTo(SEED_READINGS);
	}

	@Test
	void resetOnlyAcceptsPost() throws Exception {
		mvc.perform(get("/api/reset"))
				.andExpect(status().isMethodNotAllowed())
				.andExpect(jsonPath("$.status").value(405));
	}

	private void postJson(String url, String body) throws Exception {
		mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated());
	}

	private static <T> long maxId(List<T> records, Function<T, Long> id) {
		return records.stream().map(id).mapToLong(Long::longValue).max().orElseThrow();
	}

	private static <T> long minId(List<T> records, Function<T, Long> id) {
		return records.stream().map(id).mapToLong(Long::longValue).min().orElseThrow();
	}

}
