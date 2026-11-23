package br.edu.unifal.readingtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Reading Tracker backend.
 * Run with {@code ./mvnw spring-boot:run} (Windows: {@code mvnw.cmd spring-boot:run}).
 */
@SpringBootApplication
public class ReadingTrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReadingTrackerApplication.class, args);
	}

}
