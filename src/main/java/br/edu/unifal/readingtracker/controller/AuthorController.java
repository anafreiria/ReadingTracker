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

import br.edu.unifal.readingtracker.dto.AuthorDto;
import br.edu.unifal.readingtracker.service.AuthorService;

/**
 * Authors (FR-01): {@code GET/POST /api/authors} and {@code GET/PUT/DELETE /api/authors/{id}}.
 * HTTP only; every rule lives in {@link AuthorService}.
 */
@RestController
@RequestMapping("/api/authors")
public class AuthorController {

	private final AuthorService authorService;

	public AuthorController(AuthorService authorService) {
		this.authorService = authorService;
	}

	@GetMapping
	public List<AuthorDto> list() {
		return authorService.findAll();
	}

	@GetMapping("/{id}")
	public AuthorDto get(@PathVariable Long id) {
		return authorService.findById(id);
	}

	@PostMapping
	public ResponseEntity<AuthorDto> create(@RequestBody AuthorDto input) {
		AuthorDto created = authorService.create(input);
		return ResponseEntity.created(URI.create("/api/authors/" + created.id())).body(created);
	}

	@PutMapping("/{id}")
	public AuthorDto update(@PathVariable Long id, @RequestBody AuthorDto input) {
		return authorService.update(id, input);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		authorService.delete(id);
		return ResponseEntity.noContent().build();
	}

}
