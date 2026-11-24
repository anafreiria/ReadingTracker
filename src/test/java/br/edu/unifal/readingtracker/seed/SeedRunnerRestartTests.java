package br.edu.unifal.readingtracker.seed;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import br.edu.unifal.readingtracker.ReadingTrackerApplication;
import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.CountryRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.repository.ThemeRepository;

/**
 * FR-07 with a real file database: the seed is loaded on the first run only; later runs keep
 * the user's changes and never load the seed again.
 */
class SeedRunnerRestartTests {

	@TempDir
	Path dataDir;

	@Test
	void seedIsLoadedOnFirstRunOnlyAndChangesSurviveRestart() {
		Long createdAuthorId;
		try (ConfigurableApplicationContext firstRun = start()) {
			assertCounts(firstRun, 27, 135, 101, 143, 143);
			createdAuthorId = firstRun.getBean(AuthorRepository.class).save(new Author("Ana Maria Machado")).getId();
		}

		try (ConfigurableApplicationContext secondRun = start()) {
			// Seed not loaded again (no duplicates) and the user's author is still there
			assertCounts(secondRun, 27, 135, 102, 143, 143);
			assertThat(secondRun.getBean(AuthorRepository.class).findById(createdAuthorId))
					.map(Author::getName).contains("Ana Maria Machado");
		}
	}

	private ConfigurableApplicationContext start() {
		return new SpringApplicationBuilder(ReadingTrackerApplication.class).run(
				"--server.port=0",
				"--readingtracker.seed.enabled=true",
				"--spring.jpa.hibernate.ddl-auto=update",
				"--spring.datasource.url=jdbc:h2:file:" + dataDir.resolve("readingtracker").toAbsolutePath());
	}

	private static void assertCounts(ConfigurableApplicationContext context, long countries, long themes,
			long authors, long books, long readings) {
		assertThat(context.getBean(CountryRepository.class).count()).as("countries").isEqualTo(countries);
		assertThat(context.getBean(ThemeRepository.class).count()).as("themes").isEqualTo(themes);
		assertThat(context.getBean(AuthorRepository.class).count()).as("authors").isEqualTo(authors);
		assertThat(context.getBean(BookRepository.class).count()).as("books").isEqualTo(books);
		assertThat(context.getBean(ReadingRepository.class).count()).as("readings").isEqualTo(readings);
	}

}
