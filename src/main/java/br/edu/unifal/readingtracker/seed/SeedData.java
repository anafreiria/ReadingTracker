package br.edu.unifal.readingtracker.seed;

import java.util.List;

/**
 * Contents of seed.json (assignment Section 11): five arrays whose records refer to each other
 * by the seed's own IDs. Those IDs are only used while loading; the database generates new ones.
 */
public record SeedData(
		List<SeedCountry> countries,
		List<SeedAuthor> authors,
		List<SeedTheme> themes,
		List<SeedBook> books,
		List<SeedReading> readings) {

	public SeedData {
		countries = listOrEmpty(countries);
		authors = listOrEmpty(authors);
		themes = listOrEmpty(themes);
		books = listOrEmpty(books);
		readings = listOrEmpty(readings);
	}

	public record SeedCountry(Long id, String name) {
	}

	public record SeedAuthor(Long id, String name, Long countryId, String birthDate, String deathDate) {
	}

	public record SeedTheme(Long id, String name) {
	}

	public record SeedBook(Long id, String title, List<Long> authorIds, Integer publicationYear,
			String form, String mode, String content, List<Long> themeIds) {

		public SeedBook {
			authorIds = listOrEmpty(authorIds);
			themeIds = listOrEmpty(themeIds);
		}
	}

	public record SeedReading(Long id, Long bookId, String status, Integer yearRead, Double grade,
			String recommendedBy, String priority, String notes) {
	}

	private static <T> List<T> listOrEmpty(List<T> list) {
		return list == null ? List.of() : List.copyOf(list);
	}

}
