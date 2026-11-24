package br.edu.unifal.readingtracker.model;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Controlled value with one official spelling (assignment Section 4: "each value must be
 * stored and displayed in one consistent spelling"). The label is what the API sends and
 * receives and what the database stores, e.g. {@code "Short Story Collection"}.
 */
public interface LabeledEnum {

	String label();

	/** Exact, case-sensitive lookup: only the official spelling is accepted. */
	static <E extends Enum<E> & LabeledEnum> Optional<E> fromLabel(Class<E> type, String label) {
		if (label == null) {
			return Optional.empty();
		}
		return Arrays.stream(type.getEnumConstants())
				.filter(value -> value.label().equals(label))
				.findFirst();
	}

	/** Official labels in declaration order, e.g. for error messages or tests. */
	static <E extends Enum<E> & LabeledEnum> List<String> labels(Class<E> type) {
		return Arrays.stream(type.getEnumConstants()).map(LabeledEnum::label).toList();
	}

}
