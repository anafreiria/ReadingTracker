package br.edu.unifal.readingtracker.mapper;

import br.edu.unifal.readingtracker.dto.ThemeDto;
import br.edu.unifal.readingtracker.model.Theme;

public final class ThemeMapper {

	private ThemeMapper() {
	}

	public static ThemeDto toDto(Theme theme) {
		return new ThemeDto(theme.getId(), theme.getName());
	}

}
