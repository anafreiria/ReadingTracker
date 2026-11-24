package br.edu.unifal.readingtracker.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.unifal.readingtracker.dto.CountryDto;
import br.edu.unifal.readingtracker.mapper.CountryMapper;
import br.edu.unifal.readingtracker.repository.CountryRepository;

/**
 * Countries are a fixed list from seed.json: they cannot be created, edited or deleted through
 * the application (assignment Section 4), so this service only reads.
 */
@Service
public class CountryService {

	private final CountryRepository countryRepository;

	public CountryService(CountryRepository countryRepository) {
		this.countryRepository = countryRepository;
	}

	@Transactional(readOnly = true)
	public List<CountryDto> findAll() {
		return countryRepository.findAllByOrderByIdAsc().stream().map(CountryMapper::toDto).toList();
	}

}
