package br.edu.unifal.readingtracker.model.converter;

import br.edu.unifal.readingtracker.model.LabeledEnum;
import jakarta.persistence.AttributeConverter;

/**
 * Stores a controlled value as its official label (e.g. {@code "Want to read"}) instead of the
 * Java constant name or ordinal, so the database reads the same as seed.json and reordering
 * the enum never corrupts stored data.
 */
public abstract class LabeledEnumConverter<E extends Enum<E> & LabeledEnum> implements AttributeConverter<E, String> {

	private final Class<E> type;

	protected LabeledEnumConverter(Class<E> type) {
		this.type = type;
	}

	@Override
	public String convertToDatabaseColumn(E value) {
		return value == null ? null : value.label();
	}

	@Override
	public E convertToEntityAttribute(String label) {
		if (label == null) {
			return null;
		}
		return LabeledEnum.fromLabel(type, label).orElseThrow(() -> new IllegalArgumentException(
				"Unknown " + type.getSimpleName() + " stored in database: '" + label + "'"));
	}

}
