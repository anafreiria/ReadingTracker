package br.edu.unifal.readingtracker.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.unifal.readingtracker.dto.ReadingDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.mapper.ReadingMapper;
import br.edu.unifal.readingtracker.model.Book;
import br.edu.unifal.readingtracker.model.Reading;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.service.ReadingValidator.ValidReading;

/**
 * Readings (FR-03, FR-04, FR-05): one time the person read, or plans to read, a book. A book can
 * have several readings; re-reading a book means adding a new reading, never changing the old one.
 */
@Service
public class ReadingService {

	private final ReadingRepository readingRepository;
	private final BookRepository bookRepository;
	private final ReadingValidator readingValidator;

	public ReadingService(ReadingRepository readingRepository, BookRepository bookRepository,
			ReadingValidator readingValidator) {
		this.readingRepository = readingRepository;
		this.bookRepository = bookRepository;
		this.readingValidator = readingValidator;
	}

	/** Reading log (FR-05). The frontend applies the sort the user chooses. */
	@Transactional(readOnly = true)
	public List<ReadingDto> findAll() {
		return readingRepository.findAllByOrderByIdAsc().stream().map(ReadingMapper::toDto).toList();
	}

	@Transactional(readOnly = true)
	public ReadingDto findById(Long id) {
		return ReadingMapper.toDto(find(id));
	}

	/** Readings of one book; 404 if the book does not exist. */
	@Transactional(readOnly = true)
	public List<ReadingDto> findByBook(Long bookId) {
		findBook(bookId);
		return readingRepository.findByBook_IdOrderByIdAsc(bookId).stream().map(ReadingMapper::toDto).toList();
	}

	/** Adds a reading to a book (a first reading, a wishlist entry or a re-read). */
	@Transactional
	public ReadingDto create(Long bookId, ReadingDto input) {
		Book book = findBook(bookId);
		ValidReading valid = readingValidator.validateNew(input, book);
		Reading reading = new Reading(book, valid.status());
		copy(valid, reading);
		return ReadingMapper.toDto(readingRepository.save(reading));
	}

	/** PUT replaces the whole record: omitted optional fields become null. */
	@Transactional
	public ReadingDto update(Long id, ReadingDto input) {
		Reading reading = find(id);
		ValidReading valid = readingValidator.validateUpdate(input, id);
		copy(valid, reading);
		return ReadingMapper.toDto(reading);
	}

	@Transactional
	public void delete(Long id) {
		readingRepository.delete(find(id));
	}

	private Reading find(Long id) {
		return readingRepository.findById(id).orElseThrow(ApiException::notFound);
	}

	private Book findBook(Long id) {
		return bookRepository.findById(id).orElseThrow(ApiException::notFound);
	}

	private static void copy(ValidReading valid, Reading reading) {
		reading.setBook(valid.book());
		reading.setStatus(valid.status());
		reading.setYearRead(valid.yearRead());
		reading.setGrade(valid.grade());
		reading.setRecommendedBy(valid.recommendedBy());
		reading.setPriority(valid.priority());
		reading.setNotes(valid.notes());
	}

}
