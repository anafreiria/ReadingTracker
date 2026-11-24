package br.edu.unifal.readingtracker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import br.edu.unifal.readingtracker.config.ClockConfig;
import br.edu.unifal.readingtracker.config.ValidationMessages;
import br.edu.unifal.readingtracker.model.Priority;
import br.edu.unifal.readingtracker.model.Reading;
import br.edu.unifal.readingtracker.model.ReadingStatus;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.seed.SeedLoader;
import tools.jackson.databind.json.JsonMapper;

/**
 * {@code POST /api/books} with an optional {@code firstReading} (FR-03, one-step wishlist entry):
 * book and reading are saved together or not at all.
 */
@SpringBootTest
@AutoConfigureMockMvc
class BookFirstReadingApiTests {

	private static final int SEED_BOOKS = 143;
	private static final int SEED_READINGS = 143;

	@Autowired
	MockMvc mvc;

	@Autowired
	SeedLoader seedLoader;

	@Autowired
	BookRepository books;

	@Autowired
	AuthorRepository authors;

	@Autowired
	ReadingRepository readings;

	@BeforeEach
	void loadSeed() {
		seedLoader.clear();
		seedLoader.load();
	}

	@Test
	void wishlistEntryCreatesBookAndReadingInOneRequest() throws Exception {
		long author = authorId("William Golding");
		String body = postBook("{\"title\":\"Rites of Passage\",\"authorIds\":[" + author + "],\"publicationYear\":null,"
				+ "\"form\":null,\"mode\":null,\"content\":null,\"themeIds\":[],"
				+ "\"firstReading\":{\"status\":\"Want to read\",\"priority\":\"High\",\"recommendedBy\":\"Teco\","
				+ "\"yearRead\":null,\"grade\":null,\"notes\":null}}")
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", org.hamcrest.Matchers.matchesPattern("/api/books/\\d+")))
				// the response is the book, in the usual shape
				.andExpect(jsonPath("$.length()").value(8))
				.andExpect(jsonPath("$.title").value("Rites of Passage"))
				.andReturn().getResponse().getContentAsString();
		long bookId = JsonMapper.builder().build().readTree(body).get("id").asLong();

		mvc.perform(get("/api/books/" + bookId + "/readings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].bookId").value(bookId))
				.andExpect(jsonPath("$[0].status").value("Want to read"))
				.andExpect(jsonPath("$[0].priority").value("High"))
				.andExpect(jsonPath("$[0].recommendedBy").value("Teco"))
				.andExpect(jsonPath("$[0].yearRead").doesNotExist());
		assertThat(books.count()).isEqualTo(SEED_BOOKS + 1);
		assertThat(readings.count()).isEqualTo(SEED_READINGS + 1);
	}

	@Test
	void readBookWithYearAndGrade() throws Exception {
		long bookId = createdId(postBook("{\"title\":\"Novo\",\"publicationYear\":2001,"
				+ "\"firstReading\":{\"status\":\"Read\",\"yearRead\":2001,\"grade\":8.5,\"notes\":\"  boa  \"}}"));

		Reading reading = readings.findByBook_IdOrderByIdAsc(bookId).getFirst();
		assertThat(reading.getStatus()).isEqualTo(ReadingStatus.READ);
		assertThat(reading.getYearRead()).isEqualTo(2001);
		assertThat(reading.getGrade()).isEqualTo(8.5);
		assertThat(reading.getNotes()).isEqualTo("boa");
		assertThat(reading.getPriority()).isNull();
	}

	@Test
	void withoutFirstReadingOnlyTheBookIsCreated() throws Exception {
		long withoutField = createdId(postBook("{\"title\":\"Só o livro\"}"));
		long withNull = createdId(postBook("{\"title\":\"Só o livro\",\"firstReading\":null}"));

		assertThat(readings.findByBook_IdOrderByIdAsc(withoutField)).isEmpty();
		assertThat(readings.findByBook_IdOrderByIdAsc(withNull)).isEmpty();
		assertThat(readings.count()).isEqualTo(SEED_READINGS);
	}

	@Test
	void invalidFirstReadingCreatesNothing() throws Exception {
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{\"status\":\"Read\"}}"),
				"yearRead", ValidationMessages.REQUIRED_YEAR);
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{\"status\":\"Paused\",\"yearRead\":2020}}"),
				"yearRead", ValidationMessages.NO_YEAR);
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{\"status\":\"Reading\",\"priority\":\"Low\"}}"),
				"priority", ValidationMessages.PRIORITY);
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{\"status\":\"Lido\"}}"),
				"status", ValidationMessages.SELECTION);
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{}}"),
				"status", ValidationMessages.REQUIRED);
		assertNothingCreated();
	}

	@Test
	void firstReadingWithIdIsRejected() throws Exception {
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{\"id\":1,\"status\":\"Reading\"}}"),
				"id", ValidationMessages.CREATE_ONLY);
		// book and reading with an id: reported once
		expectFieldErrors(postBook("{\"id\":5,\"title\":\"Novo\",\"firstReading\":{\"id\":1,\"status\":\"Reading\"}}"),
				"id", ValidationMessages.CREATE_ONLY);
		assertNothingCreated();
	}

	@Test
	void bookAndReadingErrorsAreReportedTogether() throws Exception {
		postBook("{\"title\":\"  \",\"authorIds\":[999999],"
				+ "\"firstReading\":{\"status\":\"Abandoned\",\"grade\":7.3,\"priority\":\"Urgent\"}}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value(ValidationMessages.FAILED))
				.andExpect(jsonPath("$.errors[*].field").value(containsInAnyOrder("title", "authorIds", "grade", "priority")));
		assertNothingCreated();
	}

	@Test
	void yearReadCannotBeEarlierThanTheNewBooksPublicationYear() throws Exception {
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"publicationYear\":2010,"
				+ "\"firstReading\":{\"status\":\"Read\",\"yearRead\":2009}}"), "yearRead", ValidationMessages.YEAR_READ);
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{\"status\":\"Read\",\"yearRead\":"
				+ (Year.now(ClockConfig.ZONE).getValue() + 1) + "}}"), "yearRead", ValidationMessages.YEAR_READ);
		assertNothingCreated();

		// same year as the publication is fine
		createdId(postBook("{\"title\":\"Novo\",\"publicationYear\":2010,"
				+ "\"firstReading\":{\"status\":\"Read\",\"yearRead\":2010}}"));
	}

	@Test
	void invalidPublicationYearIsNotUsedToJudgeTheYearRead() throws Exception {
		int nextYear = Year.now(ClockConfig.ZONE).getValue() + 1;
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"publicationYear\":" + nextYear
				+ ",\"firstReading\":{\"status\":\"Read\",\"yearRead\":2000}}"),
				"publicationYear", ValidationMessages.PUBLICATION);
		assertNothingCreated();
	}

	@Test
	void bookIdInsideFirstReadingIsIgnored() throws Exception {
		long otherBook = books.findAllByOrderByIdAsc().getFirst().getId();
		long otherBookReadings = readings.countByBook_Id(otherBook);
		long bookId = createdId(postBook("{\"title\":\"Novo\",\"firstReading\":{\"bookId\":" + otherBook
				+ ",\"status\":\"Want to read\",\"priority\":\"Medium\"}}"));

		Reading reading = readings.findByBook_IdOrderByIdAsc(bookId).getFirst();
		assertThat(reading.getPriority()).isEqualTo(Priority.MEDIUM);
		assertThat(readings.countByBook_Id(otherBook)).isEqualTo(otherBookReadings);
	}

	@Test
	void wrongTypesInsideFirstReadingUseThePlainFieldName() throws Exception {
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{\"status\":\"Read\",\"yearRead\":2020,\"grade\":\"abc\"}}"),
				"grade", ValidationMessages.NUMBER);
		expectFieldErrors(postBook("{\"title\":\"Novo\",\"firstReading\":{\"status\":\"Read\",\"yearRead\":2020.5}}"),
				"yearRead", ValidationMessages.INTEGER);
		assertNothingCreated();
	}

	private ResultActions postBook(String json) throws Exception {
		return mvc.perform(post("/api/books").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private long createdId(ResultActions result) throws Exception {
		String body = result.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
		return JsonMapper.builder().build().readTree(body).get("id").asLong();
	}

	private long authorId(String name) {
		return authors.findAllByOrderByIdAsc().stream().filter(author -> author.getName().equals(name))
				.findFirst().orElseThrow().getId();
	}

	private void assertNothingCreated() {
		assertThat(books.count()).isEqualTo(SEED_BOOKS);
		assertThat(readings.count()).isEqualTo(SEED_READINGS);
	}

	private static void expectFieldErrors(ResultActions result, String field, String message) throws Exception {
		result.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.message").value(ValidationMessages.FAILED))
				.andExpect(jsonPath("$.errors", hasSize(1)))
				.andExpect(jsonPath("$.errors[0].field").value(field))
				.andExpect(jsonPath("$.errors[0].message").value(message));
	}

}
