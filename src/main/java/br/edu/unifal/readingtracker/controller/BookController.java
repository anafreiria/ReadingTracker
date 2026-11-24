package br.edu.unifal.readingtracker.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.edu.unifal.readingtracker.dto.BookCreateRequest;
import br.edu.unifal.readingtracker.dto.BookDto;
import br.edu.unifal.readingtracker.service.BookService;

/**
 * Books (FR-02): {@code GET/POST /api/books} and {@code GET/PUT/DELETE /api/books/{id}}.
 * POST may include an optional {@code firstReading}; DELETE also deletes the book's readings. HTTP only; every rule lives in {@link BookService}.
 */
@RestController
@RequestMapping("/api/books")
public class BookController {

	private final BookService bookService;

	public BookController(BookService bookService) {
		this.bookService = bookService;
	}

	@GetMapping
	public List<BookDto> list() {
		return bookService.findAll();
	}

	@GetMapping("/{id}")
	public BookDto get(@PathVariable Long id) {
		return bookService.findById(id);
	}

	@PostMapping
	public ResponseEntity<BookDto> create(@RequestBody BookCreateRequest input) {
		BookDto created = bookService.create(input);
		return ResponseEntity.created(URI.create("/api/books/" + created.id())).body(created);
	}

	@PutMapping("/{id}")
	public BookDto update(@PathVariable Long id, @RequestBody BookDto input) {
		return bookService.update(id, input);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		bookService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
