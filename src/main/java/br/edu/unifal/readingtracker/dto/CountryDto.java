package br.edu.unifal.readingtracker.dto;

/** Country in the same shape as seed.json: {@code {"id": 1, "name": "Russia"}}. */
public record CountryDto(Long id, String name) {
}
