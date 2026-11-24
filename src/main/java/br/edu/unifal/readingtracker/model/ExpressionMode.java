package br.edu.unifal.readingtracker.model;

import java.util.Optional;

/** Mode of expression of a book (assignment Section 4, Book). */
public enum ExpressionMode implements LabeledEnum {

	PROSE("Prose"),
	DRAMA("Drama"),
	POETRY("Poetry"),
	SEQUENTIAL_ART("Sequential Art");

	private final String label;

	ExpressionMode(String label) {
		this.label = label;
	}

	@Override
	public String label() {
		return label;
	}

	public static Optional<ExpressionMode> fromLabel(String label) {
		return LabeledEnum.fromLabel(ExpressionMode.class, label);
	}

}
