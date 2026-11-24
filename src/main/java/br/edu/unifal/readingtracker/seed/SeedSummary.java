package br.edu.unifal.readingtracker.seed;

/** How many records a seed load inserted. */
public record SeedSummary(int countries, int themes, int authors, int books, int readings) {

	@Override
	public String toString() {
		return countries + " countries, " + themes + " themes, " + authors + " authors, " + books + " books, "
				+ readings + " readings";
	}

}
