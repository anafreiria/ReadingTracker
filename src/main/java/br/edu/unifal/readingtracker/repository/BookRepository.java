package br.edu.unifal.readingtracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.edu.unifal.readingtracker.model.Book;

public interface BookRepository extends JpaRepository<Book, Long> {

	List<Book> findAllByOrderByIdAsc();

	/** Books linked to an author: an author linked to a book cannot be deleted (FR-01). */
	List<Book> findByAuthors_IdOrderByIdAsc(Long authorId);

}
