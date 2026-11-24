package br.edu.unifal.readingtracker.service;

import org.springframework.stereotype.Component;

import br.edu.unifal.readingtracker.config.ValidationMessages;
import br.edu.unifal.readingtracker.dto.ThemeDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.exception.ValidationErrors;
import br.edu.unifal.readingtracker.model.Theme;
import br.edu.unifal.readingtracker.repository.ThemeRepository;

/**
 * Rules for a new theme (assignment Section 4): name required and unique ignoring upper/lower
 * case. Returns the normalized (trimmed) name, the same normalization the frontend applies.
 */
@Component
public class ThemeValidator {

	private final ThemeRepository themeRepository;

	public ThemeValidator(ThemeRepository themeRepository) {
		this.themeRepository = themeRepository;
	}

	/**
	 * @return the trimmed name
	 * @throws ApiException 400 with every invalid field, or 409 if the name already exists
	 */
	public String validateNew(ThemeDto input) {
		ValidationErrors errors = new ValidationErrors();
		if (input.id() != null) {
			errors.add("id", ValidationMessages.CREATE_ONLY);
		}
		String name = input.name() == null ? "" : input.name().trim();
		if (name.isEmpty()) {
			errors.add("name", ValidationMessages.REQUIRED);
		} else if (name.length() > Theme.NAME_MAX_LENGTH) {
			errors.add("name", ValidationMessages.tooLong(Theme.NAME_MAX_LENGTH));
		}
		errors.throwIfAny();

		if (themeRepository.existsByNameIgnoreCase(name)) {
			throw ApiException.conflict(ValidationMessages.DUPLICATE_THEME);
		}
		return name;
	}

}
