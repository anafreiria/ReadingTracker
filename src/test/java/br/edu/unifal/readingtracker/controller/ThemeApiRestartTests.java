package br.edu.unifal.readingtracker.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
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
 * End to end over real HTTP with an H2 file database: a theme created through the API is still
 * returned by the API after the application restarts (assignment Section 7, Persistence).
 */
class ThemeApiRestartTests {

	@TempDir
	Path dataDir;

	private final HttpClient http = HttpClient.newHttpClient();

	@Test
	void themeCreatedThroughTheApiSurvivesRestart() throws Exception {
		try (ConfigurableApplicationContext firstRun = start()) {
			HttpResponse<String> created = send(firstRun, HttpRequest.newBuilder()
					.uri(uri(firstRun, "/api/themes"))
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"Cosmic Horror\"}")));
			assertThat(created.statusCode()).isEqualTo(201);
			assertThat(created.headers().firstValue("Location")).hasValueSatisfying(
					location -> assertThat(location).matches("/api/themes/\\d+"));
		}

		try (ConfigurableApplicationContext secondRun = start()) {
			HttpResponse<String> list = send(secondRun, HttpRequest.newBuilder(uri(secondRun, "/api/themes")).GET());
			assertThat(list.statusCode()).isEqualTo(200);
			assertThat(list.body()).contains("\"name\":\"Cosmic Horror\"");
			// 135 from the seed plus the new one: the seed was not loaded again
			assertThat(list.body().split("\"id\":")).hasSize(137);
		}
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
			throws IOException, InterruptedException {
		return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

}
