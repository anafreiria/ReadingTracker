package br.edu.unifal.readingtracker.mapper;

import br.edu.unifal.readingtracker.dto.ReadingDto;
import br.edu.unifal.readingtracker.model.Reading;

public final class ReadingMapper {

	private ReadingMapper() {
	}

	public static ReadingDto toDto(Reading reading) {
		return new ReadingDto(
				reading.getId(),
				reading.getBook().getId(),
				reading.getStatus().label(),
				reading.getYearRead(),
				reading.getGrade(),
				reading.getRecommendedBy(),
				reading.getPriority() == null ? null : reading.getPriority().label(),
				reading.getNotes());
	}

}
