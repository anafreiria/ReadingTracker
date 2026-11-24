package br.edu.unifal.readingtracker.controller;

import static org.assertj.core.api.Assertions.assertThat;
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

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import br.edu.unifal.readingtracker.config.ClockConfig;
import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.CountryRepository;
import br.edu.unifal.readingtracker.seed.SeedLoader;

/** /api/authors: FR-01 (CRUD, linked author), FR-06 and Section 4 author rules, Section 7 codes. */
@SpringBootTest
@AutoConfigureMockMvc
class AuthorApiTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	SeedLoader seedLoader;

	@Autowired
	AuthorRepository authors;

	@Autowired
	CountryRepository countries;

	@BeforeEach
	void loadSeed() {
		seedLoader.clear();
		seedLoader.load();
	}

	// ---------- read ----------

	@Test
	void listsTheSeedAuthorsInSeedShape() throws Exception {
		mvc.perform(get("/api/authors"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(101)))
				.andExpect(jsonPath("$[0].name").value("Alexander Pushkin"))
				.andExpect(jsonPath("$[0].countryId").value(countryId("Russia")))
				.andExpect(jsonPath("$[0].birthDate").value("1799-06-06"))
				.andExpect(jsonPath("$[0].deathDate").value("1837-02-10"))
				.andExpect(jsonPath("$[0].length()").value(5))
				.andExpect(jsonPath("$[33].name").value("Luiz Theodoro"))
				.andExpect(jsonPath("$[33].countryId").value(nullValue()))
				.andExpect(jsonPath("$[33].birthDate").value(nullValue()));
	}

	@Test
	void getsOneAuthor() throws Exception {
		mvc.perform(get("/api/authors/" + authorId("Fyodor Dostoevsky")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Fyodor Dostoevsky"))
				.andExpect(jsonPath("$.birthDate").value("1821-11-11"))
				.andExpect(jsonPath("$.deathDate").value("1881-02-09"));
	}

	@Test
	void unknownOrInvalidIdIsReported() throws Exception {
		expectError(mvc.perform(get("/api/authors/999999")), 404, "Record not found.");
		expectFieldError(mvc.perform(get("/api/authors/abc")), "id", "Use a positive integer ID.");
	}

	// ---------- create ----------

	@Test
	void createsAuthorWithOnlyAName() throws Exception {
		String location = postAuthor("{\"name\": \"  Ana Maria Machado  \"}")
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", matchesPattern("/api/authors/\\d+")))
				.andExpect(jsonPath("$.name").value("Ana Maria Machado"))
				.andExpect(jsonPath("$.countryId").value(nullValue()))
				.andExpect(jsonPath("$.birthDate").value(nullValue()))
				.andExpect(jsonPath("$.deathDate").value(nullValue()))
				.andReturn().getResponse().getHeader("Location");

		mvc.perform(get(location)).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Ana Maria Machado"));
		assertThat(authors.count()).isEqualTo(102);
	}

	@Test
	void createsAuthorWithNationalityAndDates() throws Exception {
		long brazil = countryId("Brazil");
		postAuthor("{\"name\": \"Machado de Assis Filho\", \"countryId\": " + brazil
				+ ", \"birthDate\": \"1839-06-21\", \"deathDate\": \"1908-09-29\"}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.countryId").value(brazil))
				.andExpect(jsonPath("$.birthDate").value("1839-06-21"))
				.andExpect(jsonPath("$.deathDate").value("1908-09-29"));
	}

	@Test
	void emptyDateStringsMeanNoDate() throws Exception {
		postAuthor("{\"name\": \"Sem Datas\", \"birthDate\": \"\", \"deathDate\": \"\"}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.birthDate").value(nullValue()))
				.andExpect(jsonPath("$.deathDate").value(nullValue()));
	}

	@Test
	void nameIsRequired() throws Exception {
		for (String body : new String[] { "{}", "{\"name\": null}", "{\"name\": \"   \"}" }) {
			expectFieldError(postAuthor(body), "name", "This field is required.");
		}
	}

	@Test
	void nameLongerThanTheColumnIsRejected() throws Exception {
		expectFieldError(postAuthor("{\"name\": \"" + "x".repeat(Author.NAME_MAX_LENGTH + 1) + "\"}"),
				"name", "Use at most 200 characters.");
	}

	@Test
	void duplicateNameIgnoringCaseIsConflict() throws Exception {
		for (String name : new String[] { "Fyodor Dostoevsky", "fyodor DOSTOEVSKY", "  Fyodor Dostoevsky  " }) {
			// Exact text: the author form only shows it under Name when it matches strings.js
			expectError(postAuthor("{\"name\": \"" + name + "\"}"), 409, "An author with this name already exists.");
		}
		assertThat(authors.count()).isEqualTo(101);
	}

	@Test
	void countryMustExist() throws Exception {
		expectFieldError(postAuthor("{\"name\": \"X\", \"countryId\": 999999}"), "countryId", "Choose an existing record.");
		expectFieldError(postAuthor("{\"name\": \"X\", \"countryId\": \"Brazil\"}"), "countryId", "Enter a whole number.");
	}

	@Test
	void datesMustBeRealYyyyMmDdDates() throws Exception {
		for (String date : new String[] { "2025-02-30", "11/11/1821", "1821-11-11T00:00", "0000-01-01", "1821-13-01",
				"21-11-11" }) {
			expectFieldError(postAuthor("{\"name\": \"X\", \"birthDate\": \"" + date + "\"}"), "birthDate",
					"Enter a valid date in YYYY-MM-DD format.");
			expectFieldError(postAuthor("{\"name\": \"X\", \"deathDate\": \"" + date + "\"}"), "deathDate",
					"Enter a valid date in YYYY-MM-DD format.");
		}
		postAuthor("{\"name\": \"Leap Year\", \"birthDate\": \"2024-02-29\"}").andExpect(status().isCreated());
	}

	@Test
	void birthDateCannotBeInTheFuture() throws Exception {
		LocalDate today = LocalDate.now(ClockConfig.ZONE);
		expectFieldError(postAuthor("{\"name\": \"Tomorrow\", \"birthDate\": \"" + today.plusDays(1) + "\"}"),
				"birthDate", "Birth date cannot be in the future.");
		postAuthor("{\"name\": \"Today\", \"birthDate\": \"" + today + "\"}").andExpect(status().isCreated());
	}

	@Test
	void deathDateMustBeAfterBirthDate() throws Exception {
		expectFieldError(postAuthor("{\"name\": \"X\", \"birthDate\": \"1900-01-01\", \"deathDate\": \"1899-12-31\"}"),
				"deathDate", "Death date must be after birth date.");
		expectFieldError(postAuthor("{\"name\": \"X\", \"birthDate\": \"1900-01-01\", \"deathDate\": \"1900-01-01\"}"),
				"deathDate", "Death date must be after birth date.");
		// The assignment does not require both dates together
		postAuthor("{\"name\": \"Only Death\", \"deathDate\": \"1900-01-01\"}").andExpect(status().isCreated());
	}

	@Test
	void reportsEveryInvalidFieldAtOnce() throws Exception {
		postAuthor("{\"id\": 3, \"name\": \"\", \"countryId\": 999999, \"birthDate\": \"2025-02-30\", \"deathDate\": \"x\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasSize(5)))
				.andExpect(jsonPath("$.errors[0].field").value("id"))
				.andExpect(jsonPath("$.errors[0].message").value("This operation only creates new records; omit the ID."))
				.andExpect(jsonPath("$.errors[1].field").value("name"))
				.andExpect(jsonPath("$.errors[2].field").value("countryId"))
				.andExpect(jsonPath("$.errors[3].field").value("birthDate"))
				.andExpect(jsonPath("$.errors[4].field").value("deathDate"));
		assertThat(authors.count()).isEqualTo(101);
	}

	// ---------- update ----------

	@Test
	void updatesTheWholeRecord() throws Exception {
		long id = authorId("Luiz Theodoro");
		long brazil = countryId("Brazil");
		putAuthor(id, "{\"id\": " + id + ", \"name\": \"Luiz Theodoro\", \"countryId\": " + brazil
				+ ", \"birthDate\": \"1950-05-10\", \"deathDate\": null}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(id))
				.andExpect(jsonPath("$.countryId").value(brazil))
				.andExpect(jsonPath("$.birthDate").value("1950-05-10"));

		mvc.perform(get("/api/authors/" + id))
				.andExpect(jsonPath("$.countryId").value(brazil))
				.andExpect(jsonPath("$.birthDate").value("1950-05-10"));
	}

	@Test
	void omittedOptionalFieldsAreCleared() throws Exception {
		long id = authorId("Fyodor Dostoevsky");
		putAuthor(id, "{\"name\": \"Fyodor Dostoevsky\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.countryId").value(nullValue()))
				.andExpect(jsonPath("$.birthDate").value(nullValue()))
				.andExpect(jsonPath("$.deathDate").value(nullValue()));
	}

	@Test
	void keepingOrRecasingItsOwnNameIsAllowed() throws Exception {
		long id = authorId("Fyodor Dostoevsky");
		putAuthor(id, "{\"name\": \"FYODOR DOSTOEVSKY\", \"countryId\": " + countryId("Russia") + "}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("FYODOR DOSTOEVSKY"));
	}

	@Test
	void renamingToAnotherAuthorsNameIsConflict() throws Exception {
		long id = authorId("Luiz Theodoro");
		expectError(putAuthor(id, "{\"name\": \"leo tolstoy\"}"), 409, "An author with this name already exists.");
		mvc.perform(get("/api/authors/" + id)).andExpect(jsonPath("$.name").value("Luiz Theodoro"));
	}

	@Test
	void invalidUpdateChangesNothing() throws Exception {
		long id = authorId("Fyodor Dostoevsky");
		expectFieldError(putAuthor(id, "{\"name\": \"Fyodor Dostoevsky\", \"birthDate\": \"2999-01-01\"}"),
				"birthDate", "Birth date cannot be in the future.");
		mvc.perform(get("/api/authors/" + id)).andExpect(jsonPath("$.birthDate").value("1821-11-11"));
	}

	@Test
	void bodyIdMustMatchTheUrl() throws Exception {
		long id = authorId("Luiz Theodoro");
		expectFieldError(putAuthor(id, "{\"id\": " + (id + 1) + ", \"name\": \"Luiz Theodoro\"}"),
				"id", "The ID in the request body must match the ID in the URL.");
	}

	@Test
	void updatingUnknownAuthorIs404() throws Exception {
		expectError(putAuthor(999999L, "{\"name\": \"Nobody\"}"), 404, "Record not found.");
	}

	// ---------- delete ----------

	@Test
	void deletesAuthorWithoutBooks() throws Exception {
		String location = postAuthor("{\"name\": \"Temporary\"}").andReturn().getResponse().getHeader("Location");

		mvc.perform(delete(location)).andExpect(status().isNoContent());
		expectError(mvc.perform(get(location)), 404, "Record not found.");
		assertThat(authors.count()).isEqualTo(101);
	}

	@Test
	void authorLinkedToBooksCannotBeDeletedAndTheBooksAreNamed() throws Exception {
		long id = authorId("Fyodor Dostoevsky");
		expectError(mvc.perform(delete("/api/authors/" + id)), 409,
				"Author is linked to 6 book(s): Noites Brancas, The Brothers Karamazov, The Dream of a Ridiculous Man, "
						+ "The House of the Dead, The Crocodile, The Idiot");
		expectError(mvc.perform(delete("/api/authors/" + authorId("Andy Weir"))), 409,
				"Author is linked to 1 book(s): Devoradores de Estrelas");

		assertThat(authors.findById(id)).isPresent();
		assertThat(authors.count()).isEqualTo(101);
	}

	@Test
	void deletingUnknownAuthorIs404() throws Exception {
		expectError(mvc.perform(delete("/api/authors/999999")), 404, "Record not found.");
	}

	// ---------- helpers ----------

	private ResultActions postAuthor(String json) throws Exception {
		return mvc.perform(post("/api/authors").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private ResultActions putAuthor(long id, String json) throws Exception {
		return mvc.perform(put("/api/authors/" + id).contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private long authorId(String name) {
		return authors.findAllByOrderByIdAsc().stream().filter(author -> author.getName().equals(name))
				.findFirst().orElseThrow().getId();
	}

	private long countryId(String name) {
		return countries.findAllByOrderByIdAsc().stream().filter(country -> country.getName().equals(name))
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
