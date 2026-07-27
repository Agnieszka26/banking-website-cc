import type { TransferErrorCode } from "#/lib/transfers/submit-transfer";

/**
 * Maps transfer API error codes to localized UI messages.
 * Prefer stable codes over raw backend `error.message` strings.
 */
export function transferErrorMessage(
	t: (key: string) => string,
	code: TransferErrorCode,
): string {
	switch (code) {
		case "INSUFFICIENT_FUNDS":
			return t("dashboard.transferForms.errors.insufficientFunds");
		case "UNAUTHORIZED":
			return t("dashboard.transferForms.errors.unauthorized");
		case "ACCOUNT_NOT_FOUND":
		case "FORBIDDEN":
			return t("dashboard.transferForms.errors.invalidAccount");
		case "VALIDATION_ERROR":
			return t("dashboard.transferForms.errors.validation");
		default:
			return t("dashboard.transferForms.errors.submissionFailed");
	}
}
