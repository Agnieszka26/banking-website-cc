type LogLevel = "info" | "warn" | "error";

type LogFields = Readonly<
	Record<string, string | number | boolean | null | undefined>
>;

/**
 * Structured application logger.
 * Never pass secrets, full transaction payloads, or unmasked account numbers.
 */
export function log(
	level: LogLevel,
	event: string,
	fields: LogFields = {},
): void {
	const entry = {
		level,
		event,
		...fields,
		ts: new Date().toISOString(),
	};

	const line = JSON.stringify(entry);

	if (level === "error") {
		console.error(line);
		return;
	}

	if (level === "warn") {
		console.warn(line);
		return;
	}

	console.info(line);
}
