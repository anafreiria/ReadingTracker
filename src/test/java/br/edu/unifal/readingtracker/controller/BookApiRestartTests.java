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
import br.edu.unifal.readingtracker.repository.ReadingRepository;

/**
 * Over real HTTP with an H2 file database: books created, edited and deleted (with their
 * readings) through the API keep those changes after the application restarts.
 */
class BookApiRestartTests {

	@TempDir
	Path dataDir;

	private final HttpClient http = HttpClient.newHttpClient();

	@Test
	void createUpdateAndCascadeDeleteSurviveRestart() throws Exception {
		String created;
		try (ConfigurableApplicationContext firstRun = start()) {
			HttpResponse<String> post = send(firstRun, HttpRequest.newBuilder(uri(firstRun, "/api/books"))
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString("{\"title\":\"Tyranny of the Minority\"}")));
			assertThat(post.statusCode()).isEqualTo(201);
			created = post.headers().firstValue("Location").orElseThrow();

			assertThat(send(firstRun, HttpRequest.newBuilder(uri(firstRun, created))
					.header("Content-Type", "application/json")
					.PUT(HttpRequest.BodyPublishers.ofString(
							"{\"title\":\"Tyranny of the Minority\",\"publicationYear\":2023,\"form\":\"Essay\"}")))
					.statusCode()).isEqualTo(200);

			// The first seed book and its reading
			String firstBook = "/api/books/" + firstRun.getBean(ReadingRepository.class).findAllByOrderByIdAsc()
					.getFirst().getBook().getId();
			assertThat(send(firstRun, HttpRequest.newBuilder(uri(firstRun, firstBook)).DELETE()).statusCode())
					.isEqualTo(204);
		}

		try (ConfigurableApplicationContext secondRun = start()) {
			HttpResponse<String> book = send(secondRun, HttpRequest.newBuilder(uri(secondRun, created)).GET());
			assertThat(book.statusCode()).isEqualTo(200);
			assertThat(book.body()).contains("\"publicationYear\":2023").contains("\"form\":\"Essay\"");

			HttpResponse<String> list = send(secondRun, HttpRequest.newBuilder(uri(secondRun, "/api/books")).GET());
			// 143 from the seed + 1 created - 1 deleted; the seed was not loaded again
			assertThat(list.body().split("\"title\":")).hasSize(144);
			assertThat(list.body()).doesNotContain("Dom Quixote (adaptação)");
			assertThat(secondRun.getBean(ReadingRepository.class).count()).isEqualTo(142);
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
			throws Exception {
		return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

}
