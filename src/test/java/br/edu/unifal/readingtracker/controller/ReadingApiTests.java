package br.edu.unifal.readingtracker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import br.edu.unifal.readingtracker.config.ClockConfig;
import br.edu.unifal.readingtracker.model.Reading;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.seed.SeedLoader;
import tools.jackson.databind.ObjectMapper;

/**
 * Readings: FR-03 (add/edit/delete, re-reads), FR-04 (status workflow), FR-05 (reading log
 * source), FR-06 and the Section 4 reading rules, Section 7 endpoints and codes.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ReadingApiTests {

	private static final String[] STATUSES = { "Want to read", "Reading", "Paused", "Read", "Abandoned" };

	@Autowired
	MockMvc mvc;

	@Autowired
	SeedLoader seedLoader;

	@Autowired
	BookRepository books;

	@Autowired
	ReadingRepository readings;

	@Autowired
	ObjectMapper json;

	private long stoner; // published 1965, one Read reading in 2026

	@BeforeEach
	void loadSeed() {
		seedLoader.clear();
		seedLoader.load();
		stoner = bookId("Stoner");
	}

	// ---------- read ----------

	@Test
	void listsAllReadingsInSeedShape() throws Exception {
		mvc.perform(get("/api/readings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(143)))
				.andExpect(jsonPath("$[0].length()").value(8))
				.andExpect(jsonPath("$[0].bookId").value(bookId("Dom Quixote (adaptação)")))
				.andExpect(jsonPath("$[0].status").value("Read"))
				.andExpect(jsonPath("$[0].yearRead").value(2021))
				.andExpect(jsonPath("$[0].grade").value(8.0))
				.andExpect(jsonPath("$[99].grade").value(nullValue()))
				.andExpect(jsonPath("$[114].status").value("Paused"))
				.andExpect(jsonPath("$[135].status").value("Want to read"))
				.andExpect(jsonPath("$[135].recommendedBy").value("Teco"));
	}

	@Test
	void getsOneReadingAndReportsUnknownOrInvalidId() throws Exception {
		long id = readings.findByBook_IdOrderByIdAsc(stoner).getFirst().getId();
		mvc.perform(get("/api/readings/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.bookId").value(stoner))
				.andExpect(jsonPath("$.yearRead").value(2026));
		expectError(mvc.perform(get("/api/readings/999999")), 404, "Record not found.");
		expectFieldErrors(mvc.perform(get("/api/readings/abc")), "id");
	}

	@Test
	void listsTheReadingsOfOneBook() throws Exception {
		mvc.perform(get("/api/books/" + stoner + "/readings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].bookId").value(stoner));
		expectError(mvc.perform(get("/api/books/999999/readings")), 404, "Record not found.");
	}

	// ---------- create ----------

	@Test
	void addsAWishlistReadingToABook() throws Exception {
		String location = postReading(stoner, "{\"status\": \"Want to read\", \"priority\": \"High\", "
				+ "\"recommendedBy\": \"  Teco  \", \"notes\": \"Gift idea\"}")
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", matchesPattern("/api/readings/\\d+")))
				.andExpect(jsonPath("$.bookId").value(stoner))
				.andExpect(jsonPath("$.status").value("Want to read"))
				.andExpect(jsonPath("$.priority").value("High"))
				.andExpect(jsonPath("$.recommendedBy").value("Teco"))
				.andExpect(jsonPath("$.yearRead").value(nullValue()))
				.andExpect(jsonPath("$.grade").value(nullValue()))
				.andReturn().getResponse().getHeader("Location");

		mvc.perform(get(location)).andExpect(status().isOk()).andExpect(jsonPath("$.notes").value("Gift idea"));
		assertThat(readings.count()).isEqualTo(144);
	}

	@Test
	void reReadingAddsANewReadingAndKeepsTheOldOne() throws Exception {
		Reading first = readings.findByBook_IdOrderByIdAsc(stoner).getFirst();

		postReading(stoner, "{\"status\": \"Read\", \"yearRead\": 2026, \"grade\": 9.5}").andExpect(status().isCreated());

		mvc.perform(get("/api/books/" + stoner + "/readings"))
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[0].id").value(first.getId()))
				.andExpect(jsonPath("$[0].grade").value(8.0))
				.andExpect(jsonPath("$[1].grade").value(9.5));
	}

	@Test
	void bookComesFromTheUrl() throws Exception {
		postReading(stoner, "{\"bookId\": " + stoner + ", \"status\": \"Reading\"}").andExpect(status().isCreated());
		expectFieldErrors(postReading(stoner, "{\"bookId\": " + bookId("Sapiens") + ", \"status\": \"Reading\"}"),
				"bookId");
		expectError(postReading(999999L, "{\"status\": \"Reading\"}"), 404, "Record not found.");
		expectFieldErrors(postReading(stoner, "{\"id\": 1, \"status\": \"Reading\"}"), "id");
	}

	// ---------- Section 4 rules (E8 acceptance criteria) ----------

	@Test
	void readRequiresAYear() throws Exception {
		expectFieldError(postReading(stoner, "{\"status\": \"Read\"}"), "yearRead",
				"Year read is required when status is Read.");
	}

	@Test
	void onlyReadOrAbandonedAllowAYear() throws Exception {
		for (String status : new String[] { "Want to read", "Reading", "Paused" }) {
			expectFieldError(postReading(stoner, "{\"status\": \"" + status + "\", \"yearRead\": 2024}"), "yearRead",
					"Year read is only allowed when status is Read or Abandoned.");
		}
	}

	@Test
	void onlyReadOrAbandonedAllowAGrade() throws Exception {
		for (String status : new String[] { "Want to read", "Reading", "Paused" }) {
			expectFieldError(postReading(stoner, "{\"status\": \"" + status + "\", \"grade\": 8}"), "grade",
					"Grade is only allowed when status is Read or Abandoned.");
		}
	}

	@Test
	void gradeGoesFrom0To10InStepsOfHalf() throws Exception {
		for (String grade : new String[] { "7.3", "10.5", "-0.5", "8.25" }) {
			expectFieldError(postReading(stoner, "{\"status\": \"Read\", \"yearRead\": 2024, \"grade\": " + grade + "}"),
					"grade", "Grade must be between 0 and 10 in steps of 0.5.");
		}
		for (String grade : new String[] { "0", "0.5", "7", "10" }) {
			postReading(stoner, "{\"status\": \"Read\", \"yearRead\": 2024, \"grade\": " + grade + "}")
					.andExpect(status().isCreated());
		}
	}

	@Test
	void onlyWantToReadAllowsAPriority() throws Exception {
		for (String status : new String[] { "Reading", "Paused" }) {
			expectFieldError(postReading(stoner, "{\"status\": \"" + status + "\", \"priority\": \"High\"}"), "priority",
					"Priority is only allowed when status is Want to read.");
		}
		expectFieldErrors(postReading(stoner, "{\"status\": \"Read\", \"yearRead\": 2024, \"priority\": \"Low\"}"),
				"priority");
	}

	@Test
	void yearReadCannotBeInTheFutureOrBeforePublication() throws Exception {
		int nextYear = Year.now(ClockConfig.ZONE).getValue() + 1;
		for (int year : new int[] { 1964, 1900, nextYear }) {
			expectFieldError(postReading(stoner, "{\"status\": \"Read\", \"yearRead\": " + year + "}"), "yearRead",
					"Year read cannot be in the future or before publication.");
		}
		postReading(stoner, "{\"status\": \"Read\", \"yearRead\": 1965}").andExpect(status().isCreated());
	}

	@Test
	void bookWithoutPublicationYearOnlyLimitsTheFuture() throws Exception {
		postReading(bookId("Knulp"), "{\"status\": \"Read\", \"yearRead\": 1950}").andExpect(status().isCreated());
	}

	@Test
	void abandonedAcceptsAnOptionalYearAndGrade() throws Exception {
		postReading(stoner, "{\"status\": \"Abandoned\"}").andExpect(status().isCreated());
		postReading(stoner, "{\"status\": \"Abandoned\", \"grade\": 4.5}").andExpect(status().isCreated())
				.andExpect(jsonPath("$.grade").value(4.5));
		postReading(stoner, "{\"status\": \"Abandoned\", \"yearRead\": 2025, \"grade\": 3}").andExpect(status().isCreated());
	}

	@Test
	void statusIsRequiredAndControlled() throws Exception {
		expectFieldError(postReading(stoner, "{}"), "status", "This field is required.");
		expectFieldError(postReading(stoner, "{\"status\": \"Lido\"}"), "status", "Choose a value from the list.");
		expectFieldError(postReading(stoner, "{\"status\": \"read\", \"yearRead\": 2024}"), "status",
				"Choose a value from the list.");
		expectFieldError(postReading(stoner, "{\"status\": \"Want to read\", \"priority\": \"Urgent\"}"), "priority",
				"Choose a value from the list.");
	}

	@Test
	void numbersMustHaveTheRightType() throws Exception {
		expectFieldError(postReading(stoner, "{\"status\": \"Read\", \"yearRead\": 2024.5}"), "yearRead",
				"Enter a whole number.");
		expectFieldError(postReading(stoner, "{\"status\": \"Read\", \"yearRead\": 2024, \"grade\": \"nine\"}"), "grade",
				"Enter a number.");
	}

	@Test
	void freeTextIsTrimmedAndLimited() throws Exception {
		postReading(stoner, "{\"status\": \"Reading\", \"recommendedBy\": \"   \", \"notes\": \"  \"}")
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.recommendedBy").value(nullValue()))
				.andExpect(jsonPath("$.notes").value(nullValue()));
		expectFieldError(postReading(stoner, "{\"status\": \"Reading\", \"recommendedBy\": \""
				+ "x".repeat(Reading.RECOMMENDED_BY_MAX_LENGTH + 1) + "\"}"), "recommendedBy", "Use at most 255 characters.");
		expectFieldError(postReading(stoner, "{\"status\": \"Reading\", \"notes\": \""
				+ "x".repeat(Reading.NOTES_MAX_LENGTH + 1) + "\"}"), "notes", "Use at most 10000 characters.");
	}

	@Test
	void reportsEveryInvalidFieldAtOnce() throws Exception {
		postReading(stoner, "{\"status\": \"Paused\", \"yearRead\": 1900, \"grade\": 11, \"priority\": \"High\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[*].field").value(containsInAnyOrder(
						"yearRead", "yearRead", "grade", "grade", "priority")));
		assertThat(readings.count()).isEqualTo(143);
	}

	// ---------- FR-04: the 25 status transitions ----------

	/** Values a reading typically has in each status. */
	private static Map<String, Object> stateOf(String status) {
		Map<String, Object> state = new LinkedHashMap<>();
		state.put("status", status);
		state.put("yearRead", switch (status) {
			case "Read" -> 2024;
			case "Abandoned" -> 2023;
			default -> null;
		});
		state.put("grade", switch (status) {
			case "Read" -> 8.5;
			case "Abandoned" -> 3.0;
			default -> null;
		});
		state.put("recommendedBy", "Ana");
		state.put("notes", "Notes for " + status);
		state.put("priority", status.equals("Want to read") ? "High" : null);
		return state;
	}

	/**
	 * For every pair of statuses: what the interface sends after the user confirms (fields cleared
	 * or filled in) is accepted and keeps recommendation and notes; the same change without
	 * clearing is rejected on exactly the fields the rules forbid.
	 */
	@Test
	void allTwentyFiveStatusTransitionsFollowTheRules() throws Exception {
		int checked = 0;
		for (String from : STATUSES) {
			for (String to : STATUSES) {
				Map<String, Object> source = stateOf(from);
				long id = createReading(source);

				// 1) Stale values carried over unchanged: rejected on the forbidden fields
				Map<String, Object> stale = new LinkedHashMap<>(source);
				stale.put("status", to);
				stale.put("bookId", stoner);
				List<String> expected = forbiddenFields(source, to);
				ResultActions staleResult = putReading(id, stale);
				if (expected.isEmpty()) {
					staleResult.andExpect(status().isOk());
				} else {
					staleResult.andExpect(status().isBadRequest())
							.andExpect(jsonPath("$.errors[*].field").value(containsInAnyOrder(expected.toArray())));
				}

				// 2) What the interface sends after confirmation: accepted
				Map<String, Object> prepared = prepare(source, to);
				putReading(id, prepared)
						.andExpect(status().isOk())
						.andExpect(jsonPath("$.status").value(to))
						.andExpect(jsonPath("$.recommendedBy").value("Ana"))
						.andExpect(jsonPath("$.notes").value("Notes for " + from));
				mvc.perform(get("/api/readings/" + id))
						.andExpect(jsonPath("$.status").value(to))
						.andExpect(jsonPath("$.yearRead").value(prepared.get("yearRead")))
						.andExpect(jsonPath("$.grade").value(prepared.get("grade")))
						.andExpect(jsonPath("$.priority").value(prepared.get("priority")));
				checked++;
			}
		}
		assertThat(checked).isEqualTo(25);
	}

	/** Fields that stay invalid when only the status changes. */
	private static List<String> forbiddenFields(Map<String, Object> source, String to) {
		boolean allowsResult = to.equals("Read") || to.equals("Abandoned");
		List<String> fields = new ArrayList<>();
		if (to.equals("Read") && source.get("yearRead") == null) {
			fields.add("yearRead");
		}
		if (!allowsResult && source.get("yearRead") != null) {
			fields.add("yearRead");
		}
		if (!allowsResult && source.get("grade") != null) {
			fields.add("grade");
		}
		if (!to.equals("Want to read") && source.get("priority") != null) {
			fields.add("priority");
		}
		return fields;
	}

	/** Same as prepareReadingTransition in the frontend, plus the year the user types for Read. */
	private Map<String, Object> prepare(Map<String, Object> source, String to) {
		boolean allowsResult = to.equals("Read") || to.equals("Abandoned");
		Map<String, Object> body = new LinkedHashMap<>(source);
		body.put("bookId", stoner);
		body.put("status", to);
		if (!to.equals("Want to read")) {
			body.put("priority", null);
		}
		if (!allowsResult) {
			body.put("yearRead", null);
			body.put("grade", null);
		} else if (to.equals("Read") && body.get("yearRead") == null) {
			body.put("yearRead", 2025);
		}
		return body;
	}

	// ---------- update ----------

	@Test
	void updateRequiresAnExistingBookAndCanMoveTheReading() throws Exception {
		long id = readings.findByBook_IdOrderByIdAsc(stoner).getFirst().getId();
		expectFieldError(putReading(id, Map.of("status", "Reading")), "bookId", "This field is required.");
		expectFieldError(putReading(id, Map.of("bookId", 999999, "status", "Reading")), "bookId",
				"Choose an existing record.");

		long sapiens = bookId("Sapiens");
		putReading(id, Map.of("bookId", sapiens, "status", "Reading")).andExpect(status().isOk())
				.andExpect(jsonPath("$.bookId").value(sapiens));
	}

	@Test
	void yearReadIsCheckedAgainstTheNewBook() throws Exception {
		long id = readings.findByBook_IdOrderByIdAsc(stoner).getFirst().getId();
		// Stoner was read in 2026; Devoradores de Estrelas was published in 2021
		expectFieldError(putReading(id, Map.of("bookId", bookId("Devoradores de Estrelas"), "status", "Read",
				"yearRead", 2020)), "yearRead", "Year read cannot be in the future or before publication.");
	}

	@Test
	void invalidUpdateChangesNothing() throws Exception {
		long id = readings.findByBook_IdOrderByIdAsc(stoner).getFirst().getId();
		expectFieldErrors(putReading(id, Map.of("bookId", stoner, "status", "Paused", "yearRead", 2026)), "yearRead");
		mvc.perform(get("/api/readings/" + id))
				.andExpect(jsonPath("$.status").value("Read"))
				.andExpect(jsonPath("$.yearRead").value(2026))
				.andExpect(jsonPath("$.grade").value(8.0));
	}

	@Test
	void bodyIdMustMatchTheUrlAndUnknownReadingIs404() throws Exception {
		long id = readings.findByBook_IdOrderByIdAsc(stoner).getFirst().getId();
		expectFieldError(putReading(id, Map.of("id", id + 1, "bookId", stoner, "status", "Reading")), "id",
				"The ID in the request body must match the ID in the URL.");
		expectError(putReading(999999L, Map.of("bookId", stoner, "status", "Reading")), 404, "Record not found.");
	}

	// ---------- delete ----------

	@Test
	void deletesAReadingAndKeepsTheBook() throws Exception {
		long id = readings.findByBook_IdOrderByIdAsc(stoner).getFirst().getId();

		mvc.perform(delete("/api/readings/" + id)).andExpect(status().isNoContent());

		expectError(mvc.perform(get("/api/readings/" + id)), 404, "Record not found.");
		mvc.perform(get("/api/books/" + stoner)).andExpect(status().isOk());
		mvc.perform(get("/api/books/" + stoner + "/readings")).andExpect(jsonPath("$", hasSize(0)));
		assertThat(readings.count()).isEqualTo(142);
	}

	@Test
	void deletingUnknownReadingIs404() throws Exception {
		expectError(mvc.perform(delete("/api/readings/999999")), 404, "Record not found.");
	}

	// ---------- helpers ----------

	private long createReading(Map<String, Object> state) throws Exception {
		String location = mvc.perform(post("/api/books/" + stoner + "/readings")
				.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(state)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getHeader("Location");
		return Long.parseLong(location.substring(location.lastIndexOf('/') + 1));
	}

	private ResultActions postReading(long bookId, String body) throws Exception {
		return mvc.perform(post("/api/books/" + bookId + "/readings").contentType(MediaType.APPLICATION_JSON).content(body));
	}

	private ResultActions putReading(long id, Map<String, ?> body) throws Exception {
		return mvc.perform(put("/api/readings/" + id).contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(body)));
	}

	private long bookId(String title) {
		return books.findAllByOrderByIdAsc().stream().filter(book -> book.getTitle().equals(title))
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
				.andExpect(jsonPath("$.message").value("Validation failed"))
				.andExpect(jsonPath("$.errors", hasSize(1)))
				.andExpect(jsonPath("$.errors[0].field").value(field))
				.andExpect(jsonPath("$.errors[0].message").value(message));
	}

	private static void expectFieldErrors(ResultActions result, String field) throws Exception {
		result.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasSize(1)))
				.andExpect(jsonPath("$.errors[0].field").value(field));
	}

}
