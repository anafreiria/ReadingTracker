package br.edu.unifal.readingtracker.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Loads seed.json on the first run only (FR-07): when the database is empty. Later runs keep the
 * user's changes and never load the seed again. Can be turned off with
 * {@code readingtracker.seed.enabled=false} (used by tests that need an empty database).
 */
@Component
@ConditionalOnProperty(name = "readingtracker.seed.enabled", havingValue = "true", matchIfMissing = true)
public class SeedRunner implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

	private final SeedLoader seedLoader;

	public SeedRunner(SeedLoader seedLoader) {
		this.seedLoader = seedLoader;
	}

	@Override
	public void run(String... args) {
		if (!seedLoader.isDatabaseEmpty()) {
			log.info("Database already has data; seed.json was not loaded");
			return;
		}
		SeedSummary summary = seedLoader.load();
		log.info("Database was empty; loaded seed.json: {}", summary);
	}

}
