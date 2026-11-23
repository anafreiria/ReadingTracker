package br.edu.unifal.readingtracker.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

class ClockConfigTests {

	@Test
	void clockUsesBrasiliaTime() {
		Clock clock = new ClockConfig().clock();
		assertThat(clock.getZone()).isEqualTo(ZoneId.of("America/Sao_Paulo"));
	}

}
