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
import br.edu.unifal.readingtracker.repository.BookRepository;

/**
 * Over real HTTP with an H2 file database: a reading added to a book, moved through the status
 * workflow, and another one deleted, keep those changes after the application restarts.
 */
class ReadingApiRestartTests {

	@TempDir
	Path dataDir;

	private final HttpClient http = HttpClient.newHttpClient();

	@Test
	void addEditAndDeleteSurviveRestart() throws Exception {
		String kept;
		String removed;
		String bookReadings;
		try (ConfigurableApplicationContext firstRun = start()) {
			long stoner = firstRun.getBean(BookRepository.class).findAllByOrderByIdAsc().stream()
					.filter(book -> book.getTitle().equals("Stoner")).findFirst().orElseThrow().getId();
			bookReadings = "/api/books/" + stoner + "/readings";

			kept = post(firstRun, bookReadings, "{\"status\":\"Want to read\",\"priority\":\"High\",\"recommendedBy\":\"Ana\"}");
			removed = post(firstRun, bookReadings, "{\"status\":\"Reading\"}");

			// Want to read -> Read: priority cleared, year required, recommendation kept
			assertThat(send(firstRun, HttpRequest.newBuilder(uri(firstRun, kept))
					.header("Content-Type", "application/json")
					.PUT(HttpRequest.BodyPublishers.ofString("{\"bookId\":" + stoner
							+ ",\"status\":\"Read\",\"yearRead\":2026,\"grade\":9.5,\"recommendedBy\":\"Ana\"}")))
					.statusCode()).isEqualTo(200);
			assertThat(send(firstRun, HttpRequest.newBuilder(uri(firstRun, removed)).DELETE()).statusCode())
					.isEqualTo(204);
		}

		try (ConfigurableApplicationContext secondRun = start()) {
			HttpResponse<String> reading = send(secondRun, HttpRequest.newBuilder(uri(secondRun, kept)).GET());
			assertThat(reading.statusCode()).isEqualTo(200);
			assertThat(reading.body()).contains("\"status\":\"Read\"").contains("\"yearRead\":2026")
					.contains("\"grade\":9.5").contains("\"recommendedBy\":\"Ana\"").contains("\"priority\":null");

			assertThat(send(secondRun, HttpRequest.newBuilder(uri(secondRun, removed)).GET()).statusCode())
					.isEqualTo(404);
			// Seed reading of Stoner + the kept one
			HttpResponse<String> list = send(secondRun, HttpRequest.newBuilder(uri(secondRun, bookReadings)).GET());
			assertThat(list.body().split("\"status\":")).hasSize(3);
			HttpResponse<String> all = send(secondRun, HttpRequest.newBuilder(uri(secondRun, "/api/readings")).GET());
			assertThat(all.body().split("\"status\":")).hasSize(145);
		}
	}

	private String post(ConfigurableApplicationContext context, String path, String json) throws Exception {
		HttpResponse<String> response = send(context, HttpRequest.newBuilder(uri(context, path))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(json)));
		assertThat(response.statusCode()).isEqualTo(201);
		return response.headers().firstValue("Location").orElseThrow();
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
