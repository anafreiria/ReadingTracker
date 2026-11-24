package br.edu.unifal.readingtracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.edu.unifal.readingtracker.model.Theme;

public interface ThemeRepository extends JpaRepository<Theme, Long> {

	List<Theme> findAllByOrderByIdAsc();

	/** Duplicate check when creating: theme names are unique ignoring upper/lower case. */
	boolean existsByNameIgnoreCase(String name);

}
