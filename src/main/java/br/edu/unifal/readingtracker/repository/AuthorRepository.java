package br.edu.unifal.readingtracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.edu.unifal.readingtracker.model.Author;

public interface AuthorRepository extends JpaRepository<Author, Long> {

	List<Author> findAllByOrderByIdAsc();

	/** Duplicate check when creating: author names are unique ignoring upper/lower case. */
	boolean existsByNameIgnoreCase(String name);

	/** Duplicate check when editing: ignores the author being edited. */
	boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

}
