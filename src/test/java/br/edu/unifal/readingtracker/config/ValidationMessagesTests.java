package br.edu.unifal.readingtracker.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

/**
 * Guards the contract with the frontend: the server messages must be identical to
 * TEXT.validation in strings.js, because the forms compare some of them literally.
 */
class ValidationMessagesTests {

	private static final List<Path> STRINGS_LOCATIONS = List.of(
			Path.of("frontend/js/strings.js"),
			Path.of("src/main/resources/static/js/strings.js"));

	private static final Pattern ENTRY = Pattern.compile("(\\w+): '((?:[^'\\\\]|\\\\.)*)'");

	@Test
	void messagesMatchFrontendStrings() throws IOException {
		Map<String, String> frontend = frontendValidationMessages();

		Map<String, String> expected = Map.ofEntries(
				Map.entry("failed", ValidationMessages.FAILED),
				Map.entry("required", ValidationMessages.REQUIRED),
				Map.entry("text", ValidationMessages.TEXT),
				Map.entry("integer", ValidationMessages.INTEGER),
				Map.entry("number", ValidationMessages.NUMBER),
				Map.entry("reference", ValidationMessages.REFERENCE),
				Map.entry("selection", ValidationMessages.SELECTION),
				Map.entry("list", ValidationMessages.LIST),
				Map.entry("date", ValidationMessages.DATE),
				Map.entry("futureBirth", ValidationMessages.FUTURE_BIRTH),
				Map.entry("death", ValidationMessages.DEATH),
				Map.entry("publication", ValidationMessages.PUBLICATION),
				Map.entry("existingReadings", ValidationMessages.EXISTING_READINGS),
				Map.entry("yearRead", ValidationMessages.YEAR_READ),
				Map.entry("requiredYear", ValidationMessages.REQUIRED_YEAR),
				Map.entry("noYear", ValidationMessages.NO_YEAR),
				Map.entry("grade", ValidationMessages.GRADE),
				Map.entry("noGrade", ValidationMessages.NO_GRADE),
				Map.entry("priority", ValidationMessages.PRIORITY),
				Map.entry("id", ValidationMessages.ID),
				Map.entry("record", ValidationMessages.RECORD),
				Map.entry("duplicateAuthor", ValidationMessages.DUPLICATE_AUTHOR),
				Map.entry("duplicateTheme", ValidationMessages.DUPLICATE_THEME),
				Map.entry("notFound", ValidationMessages.NOT_FOUND),
				Map.entry("createOnly", ValidationMessages.CREATE_ONLY));

		expected.forEach((key, serverMessage) ->
				assertThat(serverMessage).as("TEXT.validation.%s", key).isEqualTo(frontend.get(key)));
	}

	@Test
	void linkedAuthorMatchesFrontendFormat() {
		// TEXT.validation.linkedAuthor: titles => `Author is linked to ${titles.length} book(s): ${titles.join(', ')}`
		assertThat(ValidationMessages.linkedAuthor(List.of("Noites Brancas", "The Idiot")))
				.isEqualTo("Author is linked to 2 book(s): Noites Brancas, The Idiot");
	}

	private static Map<String, String> frontendValidationMessages() throws IOException {
		Path file = STRINGS_LOCATIONS.stream().filter(Files::exists).findFirst()
				.orElseThrow(() -> new IllegalStateException("strings.js not found in " + STRINGS_LOCATIONS));
		String source = Files.readString(file);
		int start = source.indexOf("validation: {");
		int end = source.indexOf("},", start);
		assertThat(start).as("TEXT.validation block in %s", file).isNotNegative();

		Map<String, String> messages = new HashMap<>();
		Matcher matcher = ENTRY.matcher(source.substring(start, end));
		while (matcher.find()) {
			messages.put(matcher.group(1), matcher.group(2).replace("\\'", "'"));
		}
		return messages;
	}

}
