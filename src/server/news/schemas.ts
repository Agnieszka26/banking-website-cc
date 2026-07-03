/** Validates news id server function input. */
export function parseNewsId(newsId: unknown): string {
	if (typeof newsId !== "string" || newsId.trim().length === 0) {
		throw new Error("Invalid news id");
	}

	return newsId.trim();
}
