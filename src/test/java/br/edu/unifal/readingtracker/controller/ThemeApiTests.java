package br.edu.unifal.readingtracker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import br.edu.unifal.readingtracker.model.Theme;
import br.edu.unifal.readingtracker.repository.ThemeRepository;
import br.edu.unifal.readingtracker.seed.SeedLoader;

/** GET/POST /api/themes (assignment Section 4 Themes, FR-02, Section 7 status codes and errors). */
@SpringBootTest
@AutoConfigureMockMvc
class ThemeApiTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	SeedLoader seedLoader;

	@Autowired
	ThemeRepository themes;

	@BeforeEach
	void loadSeed() {
		seedLoader.clear();
		seedLoader.load();
	}

	@Test
	void listsTheSeedThemesInOrder() throws Exception {
		mvc.perform(get("/api/themes"))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$", hasSize(135)))
				.andExpect(jsonPath("$[0].name").value("Spy"))
				.andExpect(jsonPath("$[134].name").value("Dark Fantasy"))
				.andExpect(jsonPath("$[0].length()").value(2));
	}

	@Test
	void createsThemeWithTrimmedNameAndLocation() throws Exception {
		String location = postTheme("{\"name\": \"  Cosmic Horror  \"}")
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", matchesPattern("/api/themes/\\d+")))
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.name").value("Cosmic Horror"))
				.andReturn().getResponse().getHeader("Location");

		mvc.perform(get(location))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Cosmic Horror"));
		mvc.perform(get("/api/themes"))
				.andExpect(jsonPath("$", hasSize(136)))
				.andExpect(jsonPath("$[*].name", hasItem("Cosmic Horror")));
		assertThat(themes.count()).isEqualTo(136);
	}

	@Test
	void blankMissingOrNullNameIsRequired() throws Exception {
		for (String body : new String[] { "{\"name\": \"   \"}", "{}", "{\"name\": null}", "{\"name\": \"\"}" }) {
			expectFieldErrors(postTheme(body), "name", "This field is required.");
		}
		assertThat(themes.count()).isEqualTo(135);
	}

	@Test
	void idCannotBeSentWhenCreating() throws Exception {
		expectFieldErrors(postTheme("{\"id\": 5, \"name\": \"Exile\"}"), "id",
				"This operation only creates new records; omit the ID.");
	}

	@Test
	void reportsEveryInvalidFieldAtOnce() throws Exception {
		postTheme("{\"id\": 5, \"name\": \"\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasSize(2)))
				.andExpect(jsonPath("$.errors[0].field").value("id"))
				.andExpect(jsonPath("$.errors[1].field").value("name"));
	}

	@Test
	void nameLongerThanTheColumnIsRejected() throws Exception {
		String name = "x".repeat(Theme.NAME_MAX_LENGTH + 1);
		expectFieldErrors(postTheme("{\"name\": \"" + name + "\"}"), "name", "Use at most 100 characters.");

		postTheme("{\"name\": \"" + "y".repeat(Theme.NAME_MAX_LENGTH) + "\"}").andExpect(status().isCreated());
	}

	@Test
	void duplicateNameIgnoringCaseIsConflict() throws Exception {
		for (String name : new String[] { "Gothic", "gothic", "  GOTHIC  " }) {
			postTheme("{\"name\": \"" + name + "\"}")
					.andExpect(status().isConflict())
					.andExpect(jsonPath("$.status").value(409))
					// Exact text: the book form only shows it under "New theme" when it matches
					.andExpect(jsonPath("$.message").value("A theme with this name already exists."))
					.andExpect(jsonPath("$.errors", hasSize(0)));
		}
		assertThat(themes.count()).isEqualTo(135);
	}

	@Test
	void invalidBodiesAreRejected() throws Exception {
		postTheme("{\"name\": ").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("The request body is not valid JSON."));
		expectFieldErrors(postTheme("[\"Gothic\"]"), "record", "Provide a record object.");
		mvc.perform(post("/api/themes").contentType(MediaType.TEXT_PLAIN).content("Gothic"))
				.andExpect(status().isUnsupportedMediaType());
		assertThat(themes.count()).isEqualTo(135);
	}

	@Test
	void unknownOrInvalidIdIsReported() throws Exception {
		mvc.perform(get("/api/themes/999999"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Record not found."))
				.andExpect(jsonPath("$.errors", hasSize(0)));
		expectFieldErrors(mvc.perform(get("/api/themes/abc")), "id", "Use a positive integer ID.");
	}

	@Test
	void themesCannotBeEditedOrDeleted() throws Exception {
		Long id = themes.findAllByOrderByIdAsc().getFirst().getId();
		mvc.perform(put("/api/themes/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\"}"))
				.andExpect(status().isMethodNotAllowed());
		mvc.perform(delete("/api/themes/" + id))
				.andExpect(status().isMethodNotAllowed());
		assertThat(themes.findById(id)).map(Theme::getName).contains("Spy");
	}

	private ResultActions postTheme(String json) throws Exception {
		return mvc.perform(post("/api/themes").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private static void expectFieldErrors(ResultActions result, String field, String message) throws Exception {
		result.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.message").value("Validation failed"))
				.andExpect(jsonPath("$.errors", hasSize(1)))
				.andExpect(jsonPath("$.errors[0].field").value(field))
				.andExpect(jsonPath("$.errors[0].message").value(message));
	}

}
