package br.edu.unifal.readingtracker.model;

import java.util.Optional;

/** Priority of a reading on the wishlist (assignment Section 4, Reading). */
public enum Priority implements LabeledEnum {

	LOW("Low"),
	MEDIUM("Medium"),
	HIGH("High");

	private final String label;

	Priority(String label) {
		this.label = label;
	}

	@Override
	public String label() {
		return label;
	}

	public static Optional<Priority> fromLabel(String label) {
		return LabeledEnum.fromLabel(Priority.class, label);
	}

}
