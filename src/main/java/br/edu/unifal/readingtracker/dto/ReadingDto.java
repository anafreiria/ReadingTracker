package br.edu.unifal.readingtracker.dto;

/**
 * Reading in the same shape as seed.json:
 * {@code {"id": 10, "bookId": 10, "status": "Read", "yearRead": 2021, "grade": 7,
 * "recommendedBy": null, "priority": null, "notes": null}}.
 * Status and priority use their official spelling ("Want to read", "High").
 * Also the body of POST /api/books/{id}/readings and PUT /api/readings/{id}.
 */
public record ReadingDto(Long id, Long bookId, String status, Integer yearRead, Double grade,
		String recommendedBy, String priority, String notes) {
}
