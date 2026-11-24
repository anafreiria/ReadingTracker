package br.edu.unifal.readingtracker.mapper;

import br.edu.unifal.readingtracker.dto.BookDto;
import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.LabeledEnum;
import br.edu.unifal.readingtracker.model.Theme;

public final class BookMapper {

	private BookMapper() {
	}

	/** Must run inside a transaction: authors and themes are loaded lazily. */
	public static BookDto toDto(Book book) {
		return new BookDto(
				book.getId(),
				book.getTitle(),
				book.getAuthors().stream().map(Author::getId).toList(),
				book.getPublicationYear(),
				label(book.getForm()),
				label(book.getMode()),
				label(book.getContent()),
				book.getThemes().stream().map(Theme::getId).toList());
	}

	private static String label(LabeledEnum value) {
		return value == null ? null : value.label();
	}

}
