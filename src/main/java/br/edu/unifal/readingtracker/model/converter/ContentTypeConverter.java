package br.edu.unifal.readingtracker.model.converter;

import br.edu.unifal.readingtracker.model.ContentType;
import jakarta.persistence.Converter;

@Converter
public class ContentTypeConverter extends LabeledEnumConverter<ContentType> {

	public ContentTypeConverter() {
		super(ContentType.class);
	}

}
