package br.edu.unifal.readingtracker.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import br.edu.unifal.readingtracker.model.converter.BookFormConverter;
import br.edu.unifal.readingtracker.model.converter.ContentTypeConverter;
import br.edu.unifal.readingtracker.model.converter.ExpressionModeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

/**
 * The work itself (assignment Section 4). Only the title is required: a book may be saved with
 * just its title and completed later. Readings point to the book (see {@link Reading}).
 */
@Entity
@Table(name = "books")
public class Book {

	public static final int TITLE_MAX_LENGTH = 500;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = TITLE_MAX_LENGTH)
	private String title;

	/**
	 * Zero or more existing authors. {@code @OrderColumn} keeps the order of {@code authorIds}
	 * (e.g. "Como as Democracias Morrem": Levitsky, then Ziblatt).
	 */
	@ManyToMany
	@JoinTable(name = "book_authors",
			joinColumns = @JoinColumn(name = "book_id"),
			inverseJoinColumns = @JoinColumn(name = "author_id"))
	@OrderColumn(name = "position")
	private List<Author> authors = new ArrayList<>();

	/** Original publication year; negative means BC (e.g. -429). Year 0 is invalid. */
	private Integer publicationYear;

	@Convert(converter = BookFormConverter.class)
	@Column(length = 50)
	private BookForm form;

	@Convert(converter = ExpressionModeConverter.class)
	@Column(length = 50)
	private ExpressionMode mode;

	@Convert(converter = ContentTypeConverter.class)
	@Column(length = 50)
	private ContentType content;

	/** Zero or more existing themes, in the order they were chosen. */
	@ManyToMany
	@JoinTable(name = "book_themes",
			joinColumns = @JoinColumn(name = "book_id"),
			inverseJoinColumns = @JoinColumn(name = "theme_id"))
	@OrderColumn(name = "position")
	private List<Theme> themes = new ArrayList<>();

	protected Book() {
		// Required by JPA
	}

	public Book(String title) {
		this.title = title;
	}

	public Long getId() {
		return id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public List<Author> getAuthors() {
		return Collections.unmodifiableList(authors);
	}

	/** Replaces the authors, keeping the given order. */
	public void setAuthors(List<Author> authors) {
		this.authors.clear();
		this.authors.addAll(authors);
	}

	public Integer getPublicationYear() {
		return publicationYear;
	}

	public void setPublicationYear(Integer publicationYear) {
		this.publicationYear = publicationYear;
	}

	public BookForm getForm() {
		return form;
	}

	public void setForm(BookForm form) {
		this.form = form;
	}

	public ExpressionMode getMode() {
		return mode;
	}

	public void setMode(ExpressionMode mode) {
		this.mode = mode;
	}

	public ContentType getContent() {
		return content;
	}

	public void setContent(ContentType content) {
		this.content = content;
	}

	public List<Theme> getThemes() {
		return Collections.unmodifiableList(themes);
	}

	/** Replaces the themes, keeping the given order. */
	public void setThemes(List<Theme> themes) {
		this.themes.clear();
		this.themes.addAll(themes);
	}

}
