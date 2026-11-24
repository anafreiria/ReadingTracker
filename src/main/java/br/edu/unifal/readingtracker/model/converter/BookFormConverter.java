package br.edu.unifal.readingtracker.model.converter;

import br.edu.unifal.readingtracker.model.BookForm;
import jakarta.persistence.Converter;

@Converter
public class BookFormConverter extends LabeledEnumConverter<BookForm> {

	public BookFormConverter() {
		super(BookForm.class);
	}

}
