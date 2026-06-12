export function formatMoney(amount: number, currency = "PLN"): string {
	return new Intl.NumberFormat("pl-PL", {
		style: "currency",
		currency,
	}).format(amount);
}

export function formatPlDate(date: string): string {
	const [year, month, day] = date.split("-");
	return `${day}.${month}.${year}`;
}

export function getDateRange(days = 30): { startDate: string; endDate: string } {
	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - days);

	return {
		startDate: start.toISOString().slice(0, 10),
		endDate: end.toISOString().slice(0, 10),
	};
}
