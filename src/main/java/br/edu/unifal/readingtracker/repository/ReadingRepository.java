package br.edu.unifal.readingtracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.edu.unifal.readingtracker.model.Reading;

public interface ReadingRepository extends JpaRepository<Reading, Long> {

	/** Reading log (FR-05); the frontend applies the sort chosen by the user. */
	List<Reading> findAllByOrderByIdAsc();

	List<Reading> findByBook_IdOrderByIdAsc(Long bookId);

	long countByBook_Id(Long bookId);

	/** Deleting a book also deletes its readings (FR-03). */
	void deleteByBook_Id(Long bookId);

	/** A book's publication year cannot be later than the year of one of its readings. */
	boolean existsByBook_IdAndYearReadLessThan(Long bookId, Integer year);

}
