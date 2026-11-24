package br.edu.unifal.readingtracker.dto;

import java.util.List;

/**
 * Book in the same shape as seed.json:
 * {@code {"id": 10, "title": "Em Busca de Sentido", "authorIds": [96], "publicationYear": 1946,
 * "form": null, "mode": null, "content": null, "themeIds": []}}.
 * Authors and themes are referenced by id, never retyped (assignment Section 7). Controlled values
 * use their official spelling ("Short Story", "Non-fiction"). Also the body of POST and PUT.
 */
public record BookDto(Long id, String title, List<Long> authorIds, Integer publicationYear, String form,
		String mode, String content, List<Long> themeIds) {
}
