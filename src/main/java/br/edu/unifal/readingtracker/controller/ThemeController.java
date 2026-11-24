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

import br.edu.unifal.readingtracker.dto.ThemeDto;
import br.edu.unifal.readingtracker.service.ThemeService;

/**
 * {@code GET /api/themes} lists themes; {@code POST /api/themes} creates one (201 with Location).
 * {@code GET /api/themes/{id}} is an extra endpoint so that the Location header points to a real
 * resource. Rules live in {@link ThemeService}.
 */
@RestController
@RequestMapping("/api/themes")
public class ThemeController {

	private final ThemeService themeService;

	public ThemeController(ThemeService themeService) {
		this.themeService = themeService;
	}

	@GetMapping
	public List<ThemeDto> list() {
		return themeService.findAll();
	}

	@GetMapping("/{id}")
	public ThemeDto get(@PathVariable Long id) {
		return themeService.findById(id);
	}

	@PostMapping
	public ResponseEntity<ThemeDto> create(@RequestBody ThemeDto input) {
		ThemeDto created = themeService.create(input);
		return ResponseEntity.created(URI.create("/api/themes/" + created.id())).body(created);
	}

}
