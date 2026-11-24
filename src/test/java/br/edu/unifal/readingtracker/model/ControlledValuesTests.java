package br.edu.unifal.readingtracker.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

/**
 * Controlled values must have one consistent spelling (assignment Section 4) and be the same
 * lists the frontend offers in its selects (VALUES in constants.js).
 */
class ControlledValuesTests {

	private static final List<Path> CONSTANTS_LOCATIONS = List.of(
			Path.of("frontend/js/constants.js"),
			Path.of("src/main/resources/static/js/constants.js"));

	@Test
	void labelsMatchTheAssignmentAndTheFrontend() throws IOException {
		assertThat(LabeledEnum.labels(BookForm.class)).isEqualTo(frontendValues("forms"))
				.containsExactly("Novel", "Novella", "Short Story", "Short Story Collection", "Play", "Essay",
						"Treatise", "Diary", "Graphic Novel");
		assertThat(LabeledEnum.labels(ExpressionMode.class)).isEqualTo(frontendValues("modes"))
				.containsExactly("Prose", "Drama", "Poetry", "Sequential Art");
		assertThat(LabeledEnum.labels(ContentType.class)).isEqualTo(frontendValues("contents"))
				.containsExactly("Fiction", "Non-fiction");
		assertThat(LabeledEnum.labels(ReadingStatus.class)).isEqualTo(frontendValues("statuses"))
				.containsExactly("Want to read", "Reading", "Paused", "Read", "Abandoned");
		assertThat(LabeledEnum.labels(Priority.class)).isEqualTo(frontendValues("priorities"))
				.containsExactly("Low", "Medium", "High");
	}

	@Test
	void fromLabelAcceptsOnlyTheOfficialSpelling() {
		assertThat(BookForm.fromLabel("Short Story Collection")).contains(BookForm.SHORT_STORY_COLLECTION);
		assertThat(ReadingStatus.fromLabel("Want to read")).contains(ReadingStatus.WANT_TO_READ);
		assertThat(ContentType.fromLabel("Non-fiction")).contains(ContentType.NON_FICTION);

		// Spellings found in the original Word log must be rejected
		assertThat(BookForm.fromLabel("Romance")).isEmpty();
		assertThat(ExpressionMode.fromLabel("Prosa")).isEmpty();
		assertThat(ReadingStatus.fromLabel("want to read")).isEmpty();
		assertThat(ReadingStatus.fromLabel("WANT_TO_READ")).isEmpty();
		assertThat(Priority.fromLabel(null)).isEmpty();
	}

	@Test
	void statusRulesFollowSection4() {
		assertThat(ReadingStatus.values()).allSatisfy(status -> {
			boolean readOrAbandoned = status == ReadingStatus.READ || status == ReadingStatus.ABANDONED;
			assertThat(status.allowsYearReadAndGrade()).as("%s allows year/grade", status).isEqualTo(readOrAbandoned);
			assertThat(status.requiresYearRead()).as("%s requires year", status).isEqualTo(status == ReadingStatus.READ);
			assertThat(status.allowsPriority()).as("%s allows priority", status)
					.isEqualTo(status == ReadingStatus.WANT_TO_READ);
		});
	}

	private static List<String> frontendValues(String key) throws IOException {
		Path file = CONSTANTS_LOCATIONS.stream().filter(Files::exists).findFirst()
				.orElseThrow(() -> new IllegalStateException("constants.js not found in " + CONSTANTS_LOCATIONS));
		Matcher list = Pattern.compile(key + ": Object\\.freeze\\(\\[([^\\]]*)\\]\\)").matcher(Files.readString(file));
		assertThat(list.find()).as("VALUES.%s in %s", key, file).isTrue();
		return Pattern.compile("'([^']*)'").matcher(list.group(1)).results().map(match -> match.group(1)).toList();
	}

}
