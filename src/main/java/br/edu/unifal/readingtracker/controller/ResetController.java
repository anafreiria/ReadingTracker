package br.edu.unifal.readingtracker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.edu.unifal.readingtracker.service.ResetService;

/**
 * {@code POST /api/reset} restores the initial data (FR-07) and answers 204 with no body; the
 * frontend then reloads the library. The work is done by {@link ResetService}.
 */
@RestController
@RequestMapping("/api/reset")
public class ResetController {

	private final ResetService resetService;

	public ResetController(ResetService resetService) {
		this.resetService = resetService;
	}

	@PostMapping
	public ResponseEntity<Void> reset() {
		resetService.reset();
		return ResponseEntity.noContent().build();
	}

}
