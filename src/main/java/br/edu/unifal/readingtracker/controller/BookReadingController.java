package br.edu.unifal.readingtracker.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.edu.unifal.readingtracker.dto.ReadingDto;
import br.edu.unifal.readingtracker.service.ReadingService;

/**
 * Readings of one book (FR-03): {@code GET /api/books/{id}/readings} lists them and
 * {@code POST /api/books/{id}/readings} adds one (201, Location /api/readings/{newId}).
 */
@RestController
@RequestMapping("/api/books/{bookId}/readings")
public class BookReadingController {

	private final ReadingService readingService;

	public BookReadingController(ReadingService readingService) {
		this.readingService = readingService;
	}

	@GetMapping
	public List<ReadingDto> list(@PathVariable Long bookId) {
		return readingService.findByBook(bookId);
	}

	@PostMapping
	public ResponseEntity<ReadingDto> create(@PathVariable Long bookId, @RequestBody ReadingDto input) {
		ReadingDto created = readingService.create(bookId, input);
		return ResponseEntity.created(URI.create("/api/readings/" + created.id())).body(created);
	}

}
