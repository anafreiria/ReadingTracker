package br.edu.unifal.readingtracker.model;

import br.edu.unifal.readingtracker.model.converter.PriorityConverter;
import br.edu.unifal.readingtracker.model.converter.ReadingStatusConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * One time the person read, or plans to read, a book (assignment Section 4). A book can have
 * several readings, so the wishlist (status Want to read) and the reading log share this table.
 * The rules linking status, year read, grade and priority are validated in the service layer.
 */
@Entity
@Table(name = "readings")
public class Reading {

	public static final int RECOMMENDED_BY_MAX_LENGTH = 255;
	public static final int NOTES_MAX_LENGTH = 10_000;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "book_id", nullable = false)
	private Book book;

	@Convert(converter = ReadingStatusConverter.class)
	@Column(nullable = false, length = 20)
	private ReadingStatus status;

	private Integer yearRead;

	/** 0.0 to 10.0 in steps of 0.5. */
	private Double grade;

	@Column(length = RECOMMENDED_BY_MAX_LENGTH)
	private String recommendedBy;

	@Convert(converter = PriorityConverter.class)
	@Column(length = 10)
	private Priority priority;

	@Column(length = NOTES_MAX_LENGTH)
	private String notes;

	protected Reading() {
		// Required by JPA
	}

	public Reading(Book book, ReadingStatus status) {
		this.book = book;
		this.status = status;
	}

	public Long getId() {
		return id;
	}

	public Book getBook() {
		return book;
	}

	public void setBook(Book book) {
		this.book = book;
	}

	public ReadingStatus getStatus() {
		return status;
	}

	public void setStatus(ReadingStatus status) {
		this.status = status;
	}

	public Integer getYearRead() {
		return yearRead;
	}

	public void setYearRead(Integer yearRead) {
		this.yearRead = yearRead;
	}

	public Double getGrade() {
		return grade;
	}

	public void setGrade(Double grade) {
		this.grade = grade;
	}

	public String getRecommendedBy() {
		return recommendedBy;
	}

	public void setRecommendedBy(String recommendedBy) {
		this.recommendedBy = recommendedBy;
	}

	public Priority getPriority() {
		return priority;
	}

	public void setPriority(Priority priority) {
		this.priority = priority;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

}
