package br.edu.unifal.readingtracker.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.edu.unifal.readingtracker.dto.CountryDto;
import br.edu.unifal.readingtracker.service.CountryService;

/** {@code GET /api/countries}: fixed list for the author's nationality field. Read only. */
@RestController
@RequestMapping("/api/countries")
public class CountryController {

	private final CountryService countryService;

	public CountryController(CountryService countryService) {
		this.countryService = countryService;
	}

	@GetMapping
	public List<CountryDto> list() {
		return countryService.findAll();
	}

}
