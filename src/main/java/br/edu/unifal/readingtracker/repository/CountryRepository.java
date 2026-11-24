package br.edu.unifal.readingtracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.edu.unifal.readingtracker.model.Country;

public interface CountryRepository extends JpaRepository<Country, Long> {

	List<Country> findAllByOrderByIdAsc();

}
