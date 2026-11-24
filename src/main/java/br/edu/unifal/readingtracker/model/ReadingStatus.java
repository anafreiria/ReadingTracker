package br.edu.unifal.readingtracker.model;

import java.util.Optional;

/**
 * Status of a reading (assignment Section 4, Reading, and FR-04).
 * The helper methods describe which fields each status allows; services use them to validate.
 */
public enum ReadingStatus implements LabeledEnum {

	WANT_TO_READ("Want to read"),
	READING("Reading"),
	PAUSED("Paused"),
	READ("Read"),
	ABANDONED("Abandoned");

	private final String label;

	ReadingStatus(String label) {
		this.label = label;
	}

	@Override
	public String label() {
		return label;
	}

	/** Year read is required when the status is Read. */
	public boolean requiresYearRead() {
		return this == READ;
	}

	/** Year read and grade are only allowed when the status is Read or Abandoned. */
	public boolean allowsYearReadAndGrade() {
		return this == READ || this == ABANDONED;
	}

	/** Priority is only allowed when the status is Want to read. */
	public boolean allowsPriority() {
		return this == WANT_TO_READ;
	}

	public static Optional<ReadingStatus> fromLabel(String label) {
		return LabeledEnum.fromLabel(ReadingStatus.class, label);
	}

}
