package br.edu.unifal.readingtracker.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.unifal.readingtracker.dto.BookDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.mapper.BookMapper;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.service.BookValidator.ValidBook;

/**
 * Create, view, edit and delete books (FR-02), with the Section 4 rules (FR-06). Deleting a book
 * also deletes its readings (FR-03); the frontend asks for confirmation first and shows how many.
 */
@Service
public class BookService {

	private final BookRepository bookRepository;
	private final ReadingRepository readingRepository;
	private final BookValidator bookValidator;

	public BookService(BookRepository bookRepository, ReadingRepository readingRepository,
			BookValidator bookValidator) {
		this.bookRepository = bookRepository;
		this.readingRepository = readingRepository;
		this.bookValidator = bookValidator;
	}

	@Transactional(readOnly = true)
	public List<BookDto> findAll() {
		return bookRepository.findAllByOrderByIdAsc().stream().map(BookMapper::toDto).toList();
	}

	@Transactional(readOnly = true)
	public BookDto findById(Long id) {
		return BookMapper.toDto(find(id));
	}

	@Transactional
	public BookDto create(BookDto input) {
		ValidBook valid = bookValidator.validate(input, null);
		Book book = new Book(valid.title());
		copy(valid, book);
		return BookMapper.toDto(bookRepository.save(book));
	}

	/** PUT replaces the whole record: omitted optional fields become null and omitted lists empty. */
	@Transactional
	public BookDto update(Long id, BookDto input) {
		Book book = find(id);
		ValidBook valid = bookValidator.validate(input, id);
		copy(valid, book);
		return BookMapper.toDto(book);
	}

	/** Deletes the book and all its readings in one transaction (FR-03). */
	@Transactional
	public void delete(Long id) {
		Book book = find(id);
		readingRepository.deleteByBook_Id(id);
		bookRepository.delete(book);
	}

	private Book find(Long id) {
		return bookRepository.findById(id).orElseThrow(ApiException::notFound);
	}

	private static void copy(ValidBook valid, Book book) {
		book.setTitle(valid.title());
		book.setAuthors(valid.authors());
		book.setPublicationYear(valid.publicationYear());
		book.setForm(valid.form());
		book.setMode(valid.mode());
		book.setContent(valid.content());
		book.setThemes(valid.themes());
	}

}
