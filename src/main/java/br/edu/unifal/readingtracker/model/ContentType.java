package br.edu.unifal.readingtracker.model;

import java.util.Optional;

/** Content of a book (assignment Section 4, Book). */
public enum ContentType implements LabeledEnum {

	FICTION("Fiction"),
	NON_FICTION("Non-fiction");

	private final String label;

	ContentType(String label) {
		this.label = label;
	}

	@Override
	public String label() {
		return label;
	}

	public static Optional<ContentType> fromLabel(String label) {
		return LabeledEnum.fromLabel(ContentType.class, label);
	}

}
