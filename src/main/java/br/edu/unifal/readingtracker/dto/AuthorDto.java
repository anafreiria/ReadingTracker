package br.edu.unifal.readingtracker.dto;

/**
 * Author in the same shape as seed.json:
 * {@code {"id": 4, "name": "Fyodor Dostoevsky", "countryId": 1, "birthDate": "1821-11-11", "deathDate": "1881-02-09"}}.
 * Dates are {@code YYYY-MM-DD} strings; missing values are {@code null}. Also the body of
 * {@code POST} (without id) and {@code PUT} (full record) on /api/authors.
 */
public record AuthorDto(Long id, String name, Long countryId, String birthDate, String deathDate) {
}
