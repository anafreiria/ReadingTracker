package br.edu.unifal.readingtracker.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
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

import br.edu.unifal.readingtracker.seed.SeedLoader;

/** GET /api/countries: fixed list from the seed, read only (assignment Sections 4 and 7). */
@SpringBootTest
@AutoConfigureMockMvc
class CountryApiTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	SeedLoader seedLoader;

	@BeforeEach
	void loadSeed() {
		seedLoader.clear();
		seedLoader.load();
	}

	@Test
	void listsTheSeedCountriesInOrder() throws Exception {
		mvc.perform(get("/api/countries"))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$", hasSize(27)))
				.andExpect(jsonPath("$[0].name").value("Russia"))
				.andExpect(jsonPath("$[2].name").value("Brazil"))
				.andExpect(jsonPath("$[26].name").value("Poland"))
				.andExpect(jsonPath("$[0].id").isNumber())
				// Same shape as seed.json: only id and name
				.andExpect(jsonPath("$[0].length()").value(2));
	}

	@Test
	void countriesCannotBeCreatedEditedOrDeleted() throws Exception {
		mvc.perform(post("/api/countries").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Peru\"}"))
				.andExpect(status().isMethodNotAllowed())
				.andExpect(header().string("Allow", containsString("GET")))
				.andExpect(jsonPath("$.status").value(405));
		mvc.perform(put("/api/countries").contentType(MediaType.APPLICATION_JSON).content("[]"))
				.andExpect(status().isMethodNotAllowed());
		mvc.perform(delete("/api/countries"))
				.andExpect(status().isMethodNotAllowed());

		// There is no endpoint for a single country, so it cannot be edited or deleted either
		mvc.perform(put("/api/countries/1").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\"}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Resource not found."));
		mvc.perform(delete("/api/countries/1"))
				.andExpect(status().isNotFound());

		mvc.perform(get("/api/countries")).andExpect(jsonPath("$", hasSize(27)));
	}

}
