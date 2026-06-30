/** Formats a numeric amount as a localized currency string. */
export function formatMoney(amount: number, currency = "PLN"): string {
	return new Intl.NumberFormat("pl-PL", {
		style: "currency",
		currency,
	}).format(amount);
}

/** Converts an ISO date (`YYYY-MM-DD`) to Polish display format (`DD.MM.YYYY`). */
export function formatPlDate(date: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error(`Invalid date format: expected YYYY-MM-DD, got ${date}`);
	}
	const [year, month, day] = date.split("-");
	return `${day}.${month}.${year}`;
}

/** Returns ISO start/end dates covering the last `days` days (inclusive of today). */
export function getDateRange(days = 30): { startDate: string; endDate: string } {
	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - days);

	return {
		startDate: start.toISOString().slice(0, 10),
		endDate: end.toISOString().slice(0, 10),
	};
}
