package br.edu.unifal.readingtracker.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.unifal.readingtracker.config.ValidationMessages;
import br.edu.unifal.readingtracker.dto.AuthorDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.mapper.AuthorMapper;
import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.service.AuthorValidator.ValidAuthor;

/** Create, view, edit and delete authors (FR-01), with the Section 4 rules (FR-06). */
@Service
public class AuthorService {

	private final AuthorRepository authorRepository;
	private final BookRepository bookRepository;
	private final AuthorValidator authorValidator;

	public AuthorService(AuthorRepository authorRepository, BookRepository bookRepository,
			AuthorValidator authorValidator) {
		this.authorRepository = authorRepository;
		this.bookRepository = bookRepository;
		this.authorValidator = authorValidator;
	}

	@Transactional(readOnly = true)
	public List<AuthorDto> findAll() {
		return authorRepository.findAllByOrderByIdAsc().stream().map(AuthorMapper::toDto).toList();
	}

	@Transactional(readOnly = true)
	public AuthorDto findById(Long id) {
		return AuthorMapper.toDto(find(id));
	}

	@Transactional
	public AuthorDto create(AuthorDto input) {
		ValidAuthor valid = authorValidator.validate(input, null);
		Author author = new Author(valid.name());
		copy(valid, author);
		return AuthorMapper.toDto(authorRepository.save(author));
	}

	/** PUT replaces the whole record: omitted optional fields become null. */
	@Transactional
	public AuthorDto update(Long id, AuthorDto input) {
		Author author = find(id);
		ValidAuthor valid = authorValidator.validate(input, id);
		author.setName(valid.name());
		copy(valid, author);
		return AuthorMapper.toDto(author);
	}

	/**
	 * An author linked to a book cannot be deleted (FR-01): 409 naming the linked books, e.g.
	 * "Author is linked to 2 book(s): Noites Brancas, The Idiot".
	 */
	@Transactional
	public void delete(Long id) {
		Author author = find(id);
		List<String> linkedTitles = bookRepository.findByAuthors_IdOrderByIdAsc(id).stream()
				.map(Book::getTitle)
				.toList();
		if (!linkedTitles.isEmpty()) {
			throw ApiException.conflict(ValidationMessages.linkedAuthor(linkedTitles));
		}
		authorRepository.delete(author);
	}

	private Author find(Long id) {
		return authorRepository.findById(id).orElseThrow(ApiException::notFound);
	}

	private static void copy(ValidAuthor valid, Author author) {
		author.setCountry(valid.country());
		author.setBirthDate(valid.birthDate());
		author.setDeathDate(valid.deathDate());
	}

}
