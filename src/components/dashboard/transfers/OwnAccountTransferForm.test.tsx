/** @vitest-environment jsdom */

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OwnAccountTransferForm } from "#/components/dashboard/transfers/OwnAccountTransferForm";
import type { TransferAccountOption } from "#/components/dashboard/transfers/types";
import { getMessages, translate } from "#/lib/i18n/messages";

const messages = getMessages("en");
const t = (key: string, values?: Record<string, string | number>) =>
	translate(messages, key, values);

vi.mock("#/lib/i18n", () => ({
	useTranslation: () => t,
}));

vi.mock("#/components/dashboard/transfers/AccountSelectField", () => ({
	AccountSelectField: ({
		id,
		label,
		value,
		accounts,
		onChange,
		error,
		disabled,
	}: {
		id: string;
		label: string;
		value: string;
		accounts: TransferAccountOption[];
		onChange: (value: string) => void;
		error?: string;
		disabled?: boolean;
	}) => (
		<div>
			<label htmlFor={id}>{label}</label>
			<select
				id={id}
				value={value}
				disabled={disabled}
				aria-invalid={Boolean(error)}
				onChange={(event) => onChange(event.target.value)}
			>
				<option value="">Select</option>
				{accounts.map((account) => (
					<option key={account.id} value={account.id}>
						{account.name}
					</option>
				))}
			</select>
			{error ? <p role="alert">{error}</p> : null}
		</div>
	),
}));

const accounts: TransferAccountOption[] = [
	{
		id: "src",
		name: "Checking",
		iban: "PL61109010140000071219812874",
		currency: "PLN",
		balanceMinor: 50_000,
	},
	{
		id: "dst",
		name: "Savings",
		iban: "PL61109010140000071219812875",
		currency: "PLN",
		balanceMinor: 10_000,
	},
];

function fillValidForm() {
	fireEvent.change(screen.getByLabelText(t("dashboard.transferForms.sourceAccount")), {
		target: { value: "src" },
	});
	fireEvent.change(
		screen.getByLabelText(t("dashboard.transferForms.destinationAccount")),
		{ target: { value: "dst" } },
	);
	fireEvent.change(screen.getByLabelText(t("dashboard.transferForms.amount")), {
		target: { value: "25.50" },
	});
	fireEvent.change(
		screen.getByLabelText(t("dashboard.transferForms.transferTitle")),
		{ target: { value: "Move to savings" } },
	);
}

afterEach(() => {
	cleanup();
});

describe("OwnAccountTransferForm", () => {
	it("shows required-field validation errors and does not submit", async () => {
		const onSuccess = vi.fn();
		render(
			<OwnAccountTransferForm
				accounts={accounts}
				onCancel={vi.fn()}
				onSuccess={onSuccess}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transferForms.execute"),
			}),
		);

		const alerts = await screen.findAllByRole("alert");
		expect(alerts.length).toBeGreaterThan(0);
		expect(alerts[0]?.textContent).toContain(
			t("dashboard.transferForms.errors.required"),
		);
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it("shows same-account and amount validation errors", async () => {
		const onSuccess = vi.fn();
		render(
			<OwnAccountTransferForm
				accounts={accounts}
				onCancel={vi.fn()}
				onSuccess={onSuccess}
			/>,
		);

		fireEvent.change(
			screen.getByLabelText(t("dashboard.transferForms.sourceAccount")),
			{ target: { value: "src" } },
		);
		fireEvent.change(
			screen.getByLabelText(t("dashboard.transferForms.destinationAccount")),
			{ target: { value: "src" } },
		);
		fireEvent.change(screen.getByLabelText(t("dashboard.transferForms.amount")), {
			target: { value: "0" },
		});
		fireEvent.change(
			screen.getByLabelText(t("dashboard.transferForms.transferTitle")),
			{ target: { value: "Bad" } },
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transferForms.execute"),
			}),
		);

		expect(
			await screen.findByText(t("dashboard.transferForms.errors.sameAccounts")),
		).toBeTruthy();
		expect(
			screen.getByText(t("dashboard.transferForms.errors.amountPositive")),
		).toBeTruthy();
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it("submits a valid payload on success", async () => {
		const onSuccess = vi.fn().mockResolvedValue(undefined);
		render(
			<OwnAccountTransferForm
				accounts={accounts}
				onCancel={vi.fn()}
				onSuccess={onSuccess}
			/>,
		);

		fillValidForm();
		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transferForms.execute"),
			}),
		);

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith({
				type: "own",
				sourceAccountId: "src",
				destinationAccountId: "dst",
				amount: 25.5,
				currency: "PLN",
				title: "Move to savings",
			});
		});
	});

	it("disables submit during pending request and prevents duplicates", async () => {
		let resolveSubmit!: () => void;
		const onSuccess = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveSubmit = resolve;
				}),
		);

		render(
			<OwnAccountTransferForm
				accounts={accounts}
				onCancel={vi.fn()}
				onSuccess={onSuccess}
			/>,
		);

		fillValidForm();
		const submitButton = screen.getByRole("button", {
			name: t("dashboard.transferForms.execute"),
		});
		fireEvent.click(submitButton);

		await waitFor(() => {
			const submitting = screen.getByRole("button", {
				name: t("dashboard.transferForms.submitting"),
			}) as HTMLButtonElement;
			expect(submitting.disabled).toBe(true);
		});

		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transferForms.submitting"),
			}),
		);
		expect(onSuccess).toHaveBeenCalledTimes(1);

		resolveSubmit();
		await waitFor(() => {
			const execute = screen.getByRole("button", {
				name: t("dashboard.transferForms.execute"),
			}) as HTMLButtonElement;
			expect(execute.disabled).toBe(false);
		});
	});

	it("clears loading state after a failed submission", async () => {
		const onSuccess = vi.fn().mockRejectedValue(new Error("boom"));
		render(
			<OwnAccountTransferForm
				accounts={accounts}
				onCancel={vi.fn()}
				onSuccess={onSuccess}
			/>,
		);

		fillValidForm();
		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transferForms.execute"),
			}),
		);

		await waitFor(() => {
			const execute = screen.getByRole("button", {
				name: t("dashboard.transferForms.execute"),
			}) as HTMLButtonElement;
			expect(execute.disabled).toBe(false);
		});
	});

	it("shows need-two-accounts when fewer than two ledger accounts exist", async () => {
		render(
			<OwnAccountTransferForm
				accounts={[accounts[0]!]}
				onCancel={vi.fn()}
				onSuccess={vi.fn()}
			/>,
		);

		fillValidForm();
		fireEvent.click(
			screen.getByRole("button", {
				name: t("dashboard.transferForms.execute"),
			}),
		);

		expect(
			await screen.findByText(
				t("dashboard.transferForms.errors.needTwoAccounts"),
			),
		).toBeTruthy();
	});
});
