package br.edu.unifal.readingtracker.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.edu.unifal.readingtracker.config.ValidationMessages;
import br.edu.unifal.readingtracker.dto.ThemeDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.mapper.ThemeMapper;
import br.edu.unifal.readingtracker.model.Theme;
import br.edu.unifal.readingtracker.repository.ThemeRepository;

/**
 * Themes (assignment Section 4 and FR-02): listed for the book form and created on the spot from
 * it. There is no edit or delete of themes in the assignment.
 */
@Service
public class ThemeService {

	private final ThemeRepository themeRepository;
	private final ThemeValidator themeValidator;

	public ThemeService(ThemeRepository themeRepository, ThemeValidator themeValidator) {
		this.themeRepository = themeRepository;
		this.themeValidator = themeValidator;
	}

	@Transactional(readOnly = true)
	public List<ThemeDto> findAll() {
		return themeRepository.findAllByOrderByIdAsc().stream().map(ThemeMapper::toDto).toList();
	}

	@Transactional(readOnly = true)
	public ThemeDto findById(Long id) {
		return themeRepository.findById(id).map(ThemeMapper::toDto).orElseThrow(ApiException::notFound);
	}

	@Transactional
	public ThemeDto create(ThemeDto input) {
		String name = themeValidator.validateNew(input);
		try {
			return ThemeMapper.toDto(themeRepository.saveAndFlush(new Theme(name)));
		} catch (DataIntegrityViolationException ex) {
			// Same name inserted by a concurrent request after our check: unique constraint on the column
			throw ApiException.conflict(ValidationMessages.DUPLICATE_THEME);
		}
	}

}
