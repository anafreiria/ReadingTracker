package br.edu.unifal.readingtracker.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.edu.unifal.readingtracker.dto.ReadingDto;
import br.edu.unifal.readingtracker.service.ReadingService;

/**
 * Readings: {@code GET /api/readings} (reading log, FR-05), {@code GET/PUT/DELETE /api/readings/{id}}.
 * Readings are added through {@link BookReadingController}. HTTP only; rules live in {@link ReadingService}.
 */
@RestController
@RequestMapping("/api/readings")
public class ReadingController {

	private final ReadingService readingService;

	public ReadingController(ReadingService readingService) {
		this.readingService = readingService;
	}

	@GetMapping
	public List<ReadingDto> list() {
		return readingService.findAll();
	}

	@GetMapping("/{id}")
	public ReadingDto get(@PathVariable Long id) {
		return readingService.findById(id);
	}

	@PutMapping("/{id}")
	public ReadingDto update(@PathVariable Long id, @RequestBody ReadingDto input) {
		return readingService.update(id, input);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		readingService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
