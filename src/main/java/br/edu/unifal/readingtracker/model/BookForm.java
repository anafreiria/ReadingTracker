package br.edu.unifal.readingtracker.model;

import java.util.Optional;

/** Book form (assignment Section 4, Book). */
public enum BookForm implements LabeledEnum {

	NOVEL("Novel"),
	NOVELLA("Novella"),
	SHORT_STORY("Short Story"),
	SHORT_STORY_COLLECTION("Short Story Collection"),
	PLAY("Play"),
	ESSAY("Essay"),
	TREATISE("Treatise"),
	DIARY("Diary"),
	GRAPHIC_NOVEL("Graphic Novel");

	private final String label;

	BookForm(String label) {
		this.label = label;
	}

	@Override
	public String label() {
		return label;
	}

	public static Optional<BookForm> fromLabel(String label) {
		return LabeledEnum.fromLabel(BookForm.class, label);
	}

}
