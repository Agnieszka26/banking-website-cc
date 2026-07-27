import { describe, expect, it } from "vitest";
import type { TransferErrorCode } from "#/lib/transfers/submit-transfer";
import { transferErrorMessage } from "./transfer-error-message";

/** Identity translator — asserts stable i18n keys, not locale copy. */
const tKey = (key: string) => key;

describe("transferErrorMessage", () => {
	it("maps INSUFFICIENT_FUNDS to the dedicated i18n key", () => {
		expect(transferErrorMessage(tKey, "INSUFFICIENT_FUNDS")).toBe(
			"dashboard.transferForms.errors.insufficientFunds",
		);
	});

	it("maps INTERNAL_ERROR to the generic submission failure key", () => {
		expect(transferErrorMessage(tKey, "INTERNAL_ERROR")).toBe(
			"dashboard.transferForms.errors.submissionFailed",
		);
	});

	it("maps other known API codes to their UI keys", () => {
		expect(transferErrorMessage(tKey, "UNAUTHORIZED")).toBe(
			"dashboard.transferForms.errors.unauthorized",
		);
		expect(transferErrorMessage(tKey, "ACCOUNT_NOT_FOUND")).toBe(
			"dashboard.transferForms.errors.invalidAccount",
		);
		expect(transferErrorMessage(tKey, "FORBIDDEN")).toBe(
			"dashboard.transferForms.errors.invalidAccount",
		);
		expect(transferErrorMessage(tKey, "VALIDATION_ERROR")).toBe(
			"dashboard.transferForms.errors.validation",
		);
	});

	it("falls back to generic submission failure for unexpected codes", () => {
		const unknown = "SOMETHING_NEW" as TransferErrorCode;
		expect(transferErrorMessage(tKey, unknown)).toBe(
			"dashboard.transferForms.errors.submissionFailed",
		);
	});

	it("resolves localized copy when a real translator is provided", () => {
		const messages: Record<string, string> = {
			"dashboard.transferForms.errors.insufficientFunds": "Insufficient funds",
			"dashboard.transferForms.errors.submissionFailed": "Submission failed",
		};
		const t = (key: string) => messages[key] ?? key;

		expect(transferErrorMessage(t, "INSUFFICIENT_FUNDS")).toBe(
			"Insufficient funds",
		);
		expect(transferErrorMessage(t, "INTERNAL_ERROR")).toBe("Submission failed");
	});
});
