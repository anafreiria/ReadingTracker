package br.edu.unifal.readingtracker.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Single source of "today" and "current year" for the rules that forbid future dates
 * (birth date, publication year, year read). Uses Brasília time, the assignment's reference,
 * and lets tests replace the clock with a fixed one.
 */
@Configuration
public class ClockConfig {

	public static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

	@Bean
	public Clock clock() {
		return Clock.system(ZONE);
	}

}
