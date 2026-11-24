package br.edu.unifal.readingtracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Theme tag of a book. Names are unique ignoring upper/lower case (assignment Section 4);
 * the service checks that, and the database unique constraint is an extra safety net.
 */
@Entity
@Table(name = "themes")
public class Theme {

	public static final int NAME_MAX_LENGTH = 100;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = NAME_MAX_LENGTH)
	private String name;

	protected Theme() {
		// Required by JPA
	}

	public Theme(String name) {
		this.name = name;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

}
