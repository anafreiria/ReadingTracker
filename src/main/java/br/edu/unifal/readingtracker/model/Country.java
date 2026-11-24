package br.edu.unifal.readingtracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Nationality of an author. The list comes from seed.json and cannot be created, edited or
 * deleted through the application (assignment Section 4).
 */
@Entity
@Table(name = "countries")
public class Country {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 100)
	private String name;

	protected Country() {
		// Required by JPA
	}

	public Country(String name) {
		this.name = name;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

}
