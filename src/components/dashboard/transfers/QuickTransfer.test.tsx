/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickTransfer } from "#/components/dashboard/transfers/QuickTransfer";
import type { OwnAccountTransferPayload } from "#/components/dashboard/transfers/types";
import { getMessages, translate } from "#/lib/i18n/messages";
import type { DashboardAccount } from "#/server/plaid";

const messages = getMessages("en");
const t = (key: string, values?: Record<string, string | number>) =>
	translate(messages, key, values);

const invalidate = vi.fn().mockResolvedValue(undefined);
const submitTransferMock = vi.fn();
const listLedgerAccountsMock = vi.fn();

vi.mock("#/lib/i18n", () => ({
	useTranslation: () => t,
}));

vi.mock("@posthog/react", () => ({
	usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
	useRouter: () => ({ invalidate }),
}));

vi.mock("#/lib/transfers/submit-transfer", () => ({
	submitTransfer: (...args: unknown[]) => submitTransferMock(...args),
}));

vi.mock("#/server/transfers/functions", () => ({
	listLedgerAccounts: (...args: unknown[]) => listLedgerAccountsMock(...args),
}));

vi.mock("#/components/dashboard/transfers/TransferModal", () => ({
	TransferModal: ({
		open,
		title,
		children,
	}: {
		open: boolean;
		title: string;
		children: ReactNode;
	}) =>
		open ? (
			<div role="dialog" aria-label={title}>
				{children}
			</div>
		) : null,
}));

vi.mock("#/components/dashboard/transfers/OwnAccountTransferForm", () => ({
	OwnAccountTransferForm: ({
		onSuccess,
	}: {
		onSuccess: (payload: OwnAccountTransferPayload) => void | Promise<void>;
	}) => (
		<button
			type="button"
			onClick={() =>
				void onSuccess({
					type: "own",
					sourceAccountId: "src",
					destinationAccountId: "dst",
					amount: 10,
					currency: "PLN",
					title: "Move",
				})
			}
		>
			Submit own transfer
		</button>
	),
}));

const plaidAccounts: DashboardAccount[] = [
	{
		id: "plaid-1",
		name: "Plaid Checking",
		mask: "1234",
		balance: 100,
		currency: "PLN",
		type: "depository",
	},
];

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	invalidate.mockResolvedValue(undefined);
});

describe("QuickTransfer API error and success UI", () => {
	it("renders INSUFFICIENT_FUNDS with the localized message", async () => {
		listLedgerAccountsMock.mockResolvedValue([
			{
				id: "src",
				name: "Checking",
				currency: "PLN",
				balanceMinor: 100,
			},
			{
				id: "dst",
				name: "Savings",
				currency: "PLN",
				balanceMinor: 0,
			},
		]);
		submitTransferMock.mockResolvedValue({
			ok: false,
			error: {
				code: "INSUFFICIENT_FUNDS",
				message: "Account balance is insufficient for this debit.",
			},
		});

		render(<QuickTransfer accounts={plaidAccounts} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transfer.toOwnAccount"),
			}),
		);

		await screen.findByRole("button", { name: "Submit own transfer" });
		fireEvent.click(screen.getByRole("button", { name: "Submit own transfer" }));

		expect((await screen.findByRole("alert")).textContent).toContain(
			t("dashboard.transferForms.errors.insufficientFunds"),
		);
		expect(
			screen.queryByText(t("dashboard.transferForms.success")),
		).toBeNull();
	});

	it("renders generic submission failure for INTERNAL_ERROR", async () => {
		listLedgerAccountsMock.mockResolvedValue([
			{ id: "src", name: "A", currency: "PLN", balanceMinor: 100 },
			{ id: "dst", name: "B", currency: "PLN", balanceMinor: 100 },
		]);
		submitTransferMock.mockResolvedValue({
			ok: false,
			error: { code: "INTERNAL_ERROR" },
		});

		render(<QuickTransfer accounts={plaidAccounts} />);
		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transfer.toOwnAccount"),
			}),
		);
		await screen.findByRole("button", { name: "Submit own transfer" });
		fireEvent.click(screen.getByRole("button", { name: "Submit own transfer" }));

		expect((await screen.findByRole("alert")).textContent).toContain(
			t("dashboard.transferForms.errors.submissionFailed"),
		);
	});

	it("closes the modal and shows success toast after a successful transfer", async () => {
		listLedgerAccountsMock.mockResolvedValue([
			{ id: "src", name: "A", currency: "PLN", balanceMinor: 100 },
			{ id: "dst", name: "B", currency: "PLN", balanceMinor: 100 },
		]);
		submitTransferMock.mockResolvedValue({
			ok: true,
			data: {
				id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
				transactionIds: [
					"11111111-1111-1111-1111-111111111111",
					"22222222-2222-2222-2222-222222222222",
				],
				createdAt: "2026-07-26T12:00:00.000Z",
			},
		});

		render(<QuickTransfer accounts={plaidAccounts} />);
		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transfer.toOwnAccount"),
			}),
		);
		await screen.findByRole("button", { name: "Submit own transfer" });
		fireEvent.click(screen.getByRole("button", { name: "Submit own transfer" }));

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).toBeNull();
		});
		expect(
			screen.getByText(t("dashboard.transferForms.success")),
		).toBeTruthy();
		expect(invalidate).toHaveBeenCalledTimes(1);
	});
});
