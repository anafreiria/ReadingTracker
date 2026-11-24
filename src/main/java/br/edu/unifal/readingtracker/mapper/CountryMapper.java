package br.edu.unifal.readingtracker.mapper;

import br.edu.unifal.readingtracker.dto.CountryDto;
import br.edu.unifal.readingtracker.model.Country;

public final class CountryMapper {

	private CountryMapper() {
	}

	public static CountryDto toDto(Country country) {
		return new CountryDto(country.getId(), country.getName());
	}

}
