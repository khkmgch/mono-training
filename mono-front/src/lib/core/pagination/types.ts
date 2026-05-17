/**
 * Labels rendered by `<Pagination>`. Core has no i18n; consumer supplies these.
 * `app/shared/ui/list` ships a paraglide-backed default (`DEFAULT_PAGINATION_LABELS`).
 *
 * @remarks `nav` is the accessible name of the `<nav>` landmark. WAI ARIA APG
 *   recommends every landmark have a unique label.
 */
export type PaginationLabels = {
	/** `aria-label` for the wrapping `<nav>`. */
	nav: string;
	/** Visible text and SR name for the "previous page" button. */
	previousPage: string;
	/** Visible text and SR name for the "next page" button. */
	nextPage: string;
	/**
	 * SR `aria-label` for each numbered page button. `n` is the **1-based** page
	 * number (already converted from the 0-based internal index). Defaults to
	 * `(n) => "Go to page " + n` when omitted.
	 */
	page?: (n: number) => string;
};
