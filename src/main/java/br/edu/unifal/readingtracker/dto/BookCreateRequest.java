package br.edu.unifal.readingtracker.dto;

import java.util.List;

/**
 * Body of {@code POST /api/books}: the book fields of {@link BookDto} plus an optional
 * {@code firstReading} (FR-03, one-step wishlist entry). Book and reading are saved together or
 * not at all. The reading's {@code bookId} is ignored: it always becomes the new book's id.
 *
 * <pre>
 * {"title": "Rites of Passage", "authorIds": [64], "themeIds": [],
 *  "firstReading": {"status": "Want to read", "priority": "High", "recommendedBy": "Teco"}}
 * </pre>
 */
public record BookCreateRequest(Long id, String title, List<Long> authorIds, Integer publicationYear,
		String form, String mode, String content, List<Long> themeIds, ReadingDto firstReading) {

	/** The book part of the request. */
	public BookDto book() {
		return new BookDto(id, title, authorIds, publicationYear, form, mode, content, themeIds);
	}

}
