package br.edu.unifal.readingtracker.model.converter;

import br.edu.unifal.readingtracker.model.ReadingStatus;
import jakarta.persistence.Converter;

@Converter
public class ReadingStatusConverter extends LabeledEnumConverter<ReadingStatus> {

	public ReadingStatusConverter() {
		super(ReadingStatus.class);
	}

}
