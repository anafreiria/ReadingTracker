package br.edu.unifal.readingtracker.exception;

/**
 * One invalid field and the reason, e.g. {@code {"field": "yearRead", "message": "..."}}.
 * Field names are the JSON names used in seed.json, so the frontend can show the message
 * next to the matching form field.
 */
public record FieldErrorDto(String field, String message) {
}
