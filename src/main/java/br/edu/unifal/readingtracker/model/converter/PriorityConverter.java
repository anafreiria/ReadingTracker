package br.edu.unifal.readingtracker.model.converter;

import br.edu.unifal.readingtracker.model.Priority;
import jakarta.persistence.Converter;

@Converter
public class PriorityConverter extends LabeledEnumConverter<Priority> {

	public PriorityConverter() {
		super(Priority.class);
	}

}
