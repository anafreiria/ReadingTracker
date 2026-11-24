package br.edu.unifal.readingtracker;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Checks that a file-based H2 database keeps its data after the application stops
 * and starts again (assignment Section 7: "Data must survive an application restart").
 * Uses a temporary folder instead of ./data so the developer's database is untouched.
 */
class FileDatabasePersistenceTests {

	@TempDir
	Path dataDir;

	@Test
	void dataSurvivesApplicationRestart() {
		String url = "--spring.datasource.url=jdbc:h2:file:" + dataDir.resolve("readingtracker").toAbsolutePath();

		try (ConfigurableApplicationContext first = start(url)) {
			JdbcTemplate jdbc = first.getBean(JdbcTemplate.class);
			jdbc.execute("CREATE TABLE restart_check (id INT PRIMARY KEY, label VARCHAR(50))");
			jdbc.update("INSERT INTO restart_check VALUES (1, 'persisted')");
		}

		assertThat(Files.exists(dataDir.resolve("readingtracker.mv.db"))).isTrue();

		try (ConfigurableApplicationContext second = start(url)) {
			String label = second.getBean(JdbcTemplate.class)
					.queryForObject("SELECT label FROM restart_check WHERE id = 1", String.class);
			assertThat(label).isEqualTo("persisted");
		}
	}

	private ConfigurableApplicationContext start(String datasourceUrl) {
		return new SpringApplicationBuilder(ReadingTrackerApplication.class)
				.run("--server.port=0", "--spring.jpa.hibernate.ddl-auto=none", datasourceUrl);
	}

}
