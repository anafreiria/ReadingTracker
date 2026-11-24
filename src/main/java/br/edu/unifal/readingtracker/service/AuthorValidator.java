package br.edu.unifal.readingtracker.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import br.edu.unifal.readingtracker.config.ValidationMessages;
import br.edu.unifal.readingtracker.dto.AuthorDto;
import br.edu.unifal.readingtracker.exception.ApiException;
import br.edu.unifal.readingtracker.exception.ValidationErrors;
import br.edu.unifal.readingtracker.model.Author;
import br.edu.unifal.readingtracker.model.Country;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.CountryRepository;

/**
 * Author rules (assignment Section 4), checked on the server even if the browser already did
 * (Section 7). Mirrors {@code validateAuthor} in frontend/js/validation.js:
 *
 * <ul>
 * <li>name required (trimmed) and unique ignoring upper/lower case;</li>
 * <li>nationality optional, but must be an existing country;</li>
 * <li>dates optional, real {@code YYYY-MM-DD} dates; birth date not in the future;</li>
 * <li>death date after the birth date (a death date without birth date is allowed).</li>
 * </ul>
 */
@Component
public class AuthorValidator {

	/** Same format the frontend accepts: four-digit year, no time part. */
	private static final Pattern DATE_FORMAT = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");

	private final AuthorRepository authorRepository;
	private final CountryRepository countryRepository;
	private final Clock clock;

	public AuthorValidator(AuthorRepository authorRepository, CountryRepository countryRepository, Clock clock) {
		this.authorRepository = authorRepository;
		this.countryRepository = countryRepository;
		this.clock = clock;
	}

	/** Validated values, ready to be copied into an {@link Author}. */
	public record ValidAuthor(String name, Country country, LocalDate birthDate, LocalDate deathDate) {
	}

	/**
	 * @param currentId id of the author being edited, or {@code null} when creating
	 * @throws ApiException 400 with every invalid field, or 409 if the name already exists
	 */
	public ValidAuthor validate(AuthorDto input, Long currentId) {
		ValidationErrors errors = new ValidationErrors();

		if (currentId == null && input.id() != null) {
			errors.add("id", ValidationMessages.CREATE_ONLY);
		} else if (currentId != null && input.id() != null && !input.id().equals(currentId)) {
			errors.add("id", ValidationMessages.ID_MISMATCH);
		}

		String name = input.name() == null ? "" : input.name().trim();
		if (name.isEmpty()) {
			errors.add("name", ValidationMessages.REQUIRED);
		} else if (name.length() > Author.NAME_MAX_LENGTH) {
			errors.add("name", ValidationMessages.tooLong(Author.NAME_MAX_LENGTH));
		}

		Country country = null;
		if (input.countryId() != null) {
			country = countryRepository.findById(input.countryId()).orElse(null);
			if (country == null) {
				errors.add("countryId", ValidationMessages.REFERENCE);
			}
		}

		LocalDate birthDate = parseDate(input.birthDate(), "birthDate", errors);
		LocalDate deathDate = parseDate(input.deathDate(), "deathDate", errors);
		if (birthDate != null && birthDate.isAfter(LocalDate.now(clock))) {
			errors.add("birthDate", ValidationMessages.FUTURE_BIRTH);
		}
		if (birthDate != null && deathDate != null && !deathDate.isAfter(birthDate)) {
			errors.add("deathDate", ValidationMessages.DEATH);
		}

		errors.throwIfAny();

		boolean duplicate = currentId == null
				? authorRepository.existsByNameIgnoreCase(name)
				: authorRepository.existsByNameIgnoreCaseAndIdNot(name, currentId);
		if (duplicate) {
			throw ApiException.conflict(ValidationMessages.DUPLICATE_AUTHOR);
		}
		return new ValidAuthor(name, country, birthDate, deathDate);
	}

	/** Empty or missing means "no date"; anything else must be a real YYYY-MM-DD date. */
	private static LocalDate parseDate(String value, String field, ValidationErrors errors) {
		if (value == null || value.isEmpty()) {
			return null;
		}
		if (!DATE_FORMAT.matcher(value).matches() || value.startsWith("0000")) {
			errors.add(field, ValidationMessages.DATE);
			return null;
		}
		try {
			// ISO_LOCAL_DATE is strict about day of month: 2025-02-30 is rejected
			return LocalDate.parse(value);
		} catch (DateTimeParseException ex) {
			errors.add(field, ValidationMessages.DATE);
			return null;
		}
	}

}
