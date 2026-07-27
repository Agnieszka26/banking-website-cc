import { describe, expect, it } from "vitest";
import { transferErrorMessage } from "./transfer-error-message";

const messages: Record<string, string> = {
	"dashboard.transferForms.errors.insufficientFunds": "Insufficient funds",
	"dashboard.transferForms.errors.unauthorized": "Please sign in",
	"dashboard.transferForms.errors.invalidAccount": "Account not found",
	"dashboard.transferForms.errors.validation": "Check details",
	"dashboard.transferForms.errors.submissionFailed": "Submission failed",
};

const t = (key: string) => messages[key] ?? key;

describe("transferErrorMessage", () => {
	it("maps INSUFFICIENT_FUNDS to the dedicated message", () => {
		expect(transferErrorMessage(t, "INSUFFICIENT_FUNDS")).toBe(
			"Insufficient funds",
		);
	});

	it("maps known auth and account codes", () => {
		expect(transferErrorMessage(t, "UNAUTHORIZED")).toBe("Please sign in");
		expect(transferErrorMessage(t, "ACCOUNT_NOT_FOUND")).toBe(
			"Account not found",
		);
		expect(transferErrorMessage(t, "FORBIDDEN")).toBe("Account not found");
		expect(transferErrorMessage(t, "VALIDATION_ERROR")).toBe("Check details");
	});

	it("maps unknown / internal errors to generic submission failure", () => {
		expect(transferErrorMessage(t, "INTERNAL_ERROR")).toBe("Submission failed");
	});
});
