package br.edu.unifal.readingtracker.service;

import java.util.List;
import java.util.function.Supplier;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.unifal.readingtracker.dto.BookCreateRequest;
import br.edu.unifal.readingtracker.dto.BookDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.exception.ValidationErrors;
import br.edu.unifal.readingtracker.mapper.BookMapper;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.Reading;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.service.BookValidator.ValidBook;
import br.edu.unifal.readingtracker.service.ReadingValidator.ValidReading;

/**
 * Create, view, edit and delete books (FR-02), with the Section 4 rules (FR-06). Deleting a book
 * also deletes its readings (FR-03); the frontend asks for confirmation first and shows how many.
 * A new book may come with its first reading, saved in the same transaction (FR-03).
 */
@Service
public class BookService {

	private final BookRepository bookRepository;
	private final ReadingRepository readingRepository;
	private final BookValidator bookValidator;
	private final ReadingValidator readingValidator;

	public BookService(BookRepository bookRepository, ReadingRepository readingRepository,
			BookValidator bookValidator, ReadingValidator readingValidator) {
		this.bookRepository = bookRepository;
		this.readingRepository = readingRepository;
		this.bookValidator = bookValidator;
		this.readingValidator = readingValidator;
	}

	@Transactional(readOnly = true)
	public List<BookDto> findAll() {
		return bookRepository.findAllByOrderByIdAsc().stream().map(BookMapper::toDto).toList();
	}

	@Transactional(readOnly = true)
	public BookDto findById(Long id) {
		return BookMapper.toDto(find(id));
	}

	/**
	 * Creates the book and, if sent, its first reading, in one transaction: if either is invalid,
	 * nothing is saved and the 400 lists the errors of both. Reading errors use their usual field
	 * names ({@code status}, {@code yearRead}...), as in the first reading section of the book form.
	 */
	@Transactional
	public BookDto create(BookCreateRequest input) {
		BookDto bookInput = input.book();
		ValidationErrors errors = new ValidationErrors();
		ValidBook validBook = collect(() -> bookValidator.validate(bookInput, null), errors);
		ValidReading validReading = null;
		if (input.firstReading() != null) {
			// The year read cannot be earlier than the new book's publication year, when that one is valid
			Integer publicationYear = errors.hasErrorFor("publicationYear") ? null : bookInput.publicationYear();
			validReading = collect(() -> readingValidator.validateFirstReading(input.firstReading(), publicationYear),
					errors);
		}
		errors.throwIfAny();

		Book book = new Book(validBook.title());
		copy(validBook, book);
		bookRepository.save(book);
		if (validReading != null) {
			Reading reading = new Reading(book, validReading.status());
			reading.setYearRead(validReading.yearRead());
			reading.setGrade(validReading.grade());
			reading.setRecommendedBy(validReading.recommendedBy());
			reading.setPriority(validReading.priority());
			reading.setNotes(validReading.notes());
			readingRepository.save(reading);
		}
		return BookMapper.toDto(book);
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

	/** Runs a validator and keeps its 400 field errors instead of stopping at the first one. */
	private static <T> T collect(Supplier<T> validation, ValidationErrors errors) {
		try {
			return validation.get();
		} catch (ApiException ex) {
			if (ex.getStatus() != ApiException.BAD_REQUEST) {
				throw ex;
			}
			errors.addAll(ex.getErrors());
			return null;
		}
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
