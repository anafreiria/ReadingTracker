package br.edu.unifal.readingtracker.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.server.context.WebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;

import br.edu.unifal.readingtracker.ReadingTrackerApplication;

/**
 * Over real HTTP with an H2 file database: authors created, edited and deleted through the API
 * keep those changes after the application restarts (assignment Section 7, Persistence).
 */
class AuthorApiRestartTests {

	@TempDir
	Path dataDir;

	private final HttpClient http = HttpClient.newHttpClient();

	@Test
	void createUpdateAndDeleteSurviveRestart() throws Exception {
		String kept;
		String removed;
		try (ConfigurableApplicationContext firstRun = start()) {
			kept = post(firstRun, "{\"name\":\"Ana Maria Machado\"}").headers().firstValue("Location").orElseThrow();
			removed = post(firstRun, "{\"name\":\"Temporary Author\"}").headers().firstValue("Location").orElseThrow();

			assertThat(send(firstRun, HttpRequest.newBuilder(uri(firstRun, kept))
					.header("Content-Type", "application/json")
					.PUT(HttpRequest.BodyPublishers.ofString("{\"name\":\"Ana Maria Machado\",\"birthDate\":\"1941-12-24\"}")))
					.statusCode()).isEqualTo(200);
			assertThat(send(firstRun, HttpRequest.newBuilder(uri(firstRun, removed)).DELETE()).statusCode())
					.isEqualTo(204);
		}

		try (ConfigurableApplicationContext secondRun = start()) {
			HttpResponse<String> updated = send(secondRun, HttpRequest.newBuilder(uri(secondRun, kept)).GET());
			assertThat(updated.statusCode()).isEqualTo(200);
			assertThat(updated.body()).contains("\"birthDate\":\"1941-12-24\"");

			assertThat(send(secondRun, HttpRequest.newBuilder(uri(secondRun, removed)).GET()).statusCode())
					.isEqualTo(404);

			HttpResponse<String> list = send(secondRun, HttpRequest.newBuilder(uri(secondRun, "/api/authors")).GET());
			// 101 from the seed + 1 kept author; the seed was not loaded again
			assertThat(list.body().split("\"id\":")).hasSize(103);
		}
	}

	private HttpResponse<String> post(ConfigurableApplicationContext context, String json) throws Exception {
		HttpResponse<String> response = send(context, HttpRequest.newBuilder(uri(context, "/api/authors"))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(json)));
		assertThat(response.statusCode()).isEqualTo(201);
		return response;
	}

	private ConfigurableApplicationContext start() {
		return new SpringApplicationBuilder(ReadingTrackerApplication.class).run(
				"--server.port=0",
				"--readingtracker.seed.enabled=true",
				"--spring.jpa.hibernate.ddl-auto=update",
				"--spring.datasource.url=jdbc:h2:file:" + dataDir.resolve("readingtracker").toAbsolutePath());
	}

	private static URI uri(ConfigurableApplicationContext context, String path) {
		int port = ((WebServerApplicationContext) context).getWebServer().getPort();
		return URI.create("http://localhost:" + port + path);
	}

	private HttpResponse<String> send(ConfigurableApplicationContext context, HttpRequest.Builder request)
			throws Exception {
		return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

}
