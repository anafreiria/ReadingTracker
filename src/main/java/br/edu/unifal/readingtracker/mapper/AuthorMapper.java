package br.edu.unifal.readingtracker.mapper;

import java.time.LocalDate;

import br.edu.unifal.readingtracker.dto.AuthorDto;
import br.edu.unifal.readingtracker.model.Author;

public final class AuthorMapper {

	private AuthorMapper() {
	}

	public static AuthorDto toDto(Author author) {
		return new AuthorDto(
				author.getId(),
				author.getName(),
				author.getCountry() == null ? null : author.getCountry().getId(),
				text(author.getBirthDate()),
				text(author.getDeathDate()));
	}

	private static String text(LocalDate date) {
		return date == null ? null : date.toString();
	}

}
