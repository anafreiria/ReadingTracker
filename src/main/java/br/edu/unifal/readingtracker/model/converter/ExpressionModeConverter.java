package br.edu.unifal.readingtracker.model.converter;

import br.edu.unifal.readingtracker.model.ExpressionMode;
import jakarta.persistence.Converter;

@Converter
public class ExpressionModeConverter extends LabeledEnumConverter<ExpressionMode> {

	public ExpressionModeConverter() {
		super(ExpressionMode.class);
	}

}
