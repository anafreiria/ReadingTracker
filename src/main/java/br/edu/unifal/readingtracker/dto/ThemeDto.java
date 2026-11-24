package br.edu.unifal.readingtracker.dto;

/**
 * Theme in the same shape as seed.json: {@code {"id": 1, "name": "Spy"}}.
 * Also the body of {@code POST /api/themes}, where {@code id} must be omitted.
 */
public record ThemeDto(Long id, String name) {
}
