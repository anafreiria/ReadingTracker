package br.edu.unifal.readingtracker.model.converter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import br.edu.unifal.readingtracker.model.BookForm;
import br.edu.unifal.readingtracker.model.ReadingStatus;

class LabeledEnumConverterTests {

	private final BookFormConverter forms = new BookFormConverter();
	private final ReadingStatusConverter statuses = new ReadingStatusConverter();

	@Test
	void storesTheOfficialLabel() {
		assertThat(forms.convertToDatabaseColumn(BookForm.GRAPHIC_NOVEL)).isEqualTo("Graphic Novel");
		assertThat(statuses.convertToDatabaseColumn(ReadingStatus.WANT_TO_READ)).isEqualTo("Want to read");
	}

	@Test
	void readsTheOfficialLabel() {
		assertThat(forms.convertToEntityAttribute("Short Story")).isEqualTo(BookForm.SHORT_STORY);
		assertThat(statuses.convertToEntityAttribute("Abandoned")).isEqualTo(ReadingStatus.ABANDONED);
	}

	@Test
	void keepsMissingValuesAsNull() {
		assertThat(forms.convertToDatabaseColumn(null)).isNull();
		assertThat(forms.convertToEntityAttribute(null)).isNull();
	}

	@Test
	void rejectsUnknownStoredValue() {
		assertThatThrownBy(() -> forms.convertToEntityAttribute("Romance"))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("BookForm")
				.hasMessageContaining("Romance");
	}

}
