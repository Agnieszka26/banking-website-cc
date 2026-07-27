import { usePostHog } from "@posthog/react";
import { Building2, User, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { OwnAccountTransferForm } from "#/components/dashboard/transfers/OwnAccountTransferForm";
import { RecipientTransferForm } from "#/components/dashboard/transfers/RecipientTransferForm";
import { TaxTransferForm } from "#/components/dashboard/transfers/TaxTransferForm";
import { TransferModal } from "#/components/dashboard/transfers/TransferModal";
import { TransferSuccessToast } from "#/components/dashboard/transfers/TransferSuccessToast";
import type {
	TransferAccountOption,
	TransferPayload,
	TransferType,
} from "#/components/dashboard/transfers/types";
import { useTranslation } from "#/lib/i18n";
import { submitTransfer } from "#/lib/transfers/submit-transfer";
import { transferErrorMessage } from "#/lib/transfers/transfer-error-message";
import type { DashboardAccount } from "#/server/plaid";
import { listLedgerAccounts } from "#/server/transfers/functions";

const transferActions = [
	{
		type: "own" as const,
		labelKey: "dashboard.transfer.toOwnAccount",
		icon: Wallet,
	},
	{
		type: "recipient" as const,
		labelKey: "dashboard.transfer.toRecipient",
		icon: User,
	},
	{
		type: "tax" as const,
		labelKey: "dashboard.transfer.taxes",
		icon: Building2,
	},
] as const;

type QuickTransferProps = {
	accounts: DashboardAccount[];
};

export function QuickTransfer({ accounts }: QuickTransferProps) {
	const t = useTranslation();
	const posthog = usePostHog();

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [activeTransfer, setActiveTransfer] = useState<TransferType | null>(
		null,
	);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [ledgerAccounts, setLedgerAccounts] = useState<TransferAccountOption[]>(
		[],
	);
	const [ledgerAccountsLoading, setLedgerAccountsLoading] = useState(false);

	const closeModal = useCallback(() => {
		setActiveTransfer(null);
		setErrorMessage(null);
	}, []);

	useEffect(() => {
		if (activeTransfer !== "own") {
			return;
		}

		let cancelled = false;
		setLedgerAccountsLoading(true);

		listLedgerAccounts()
			.then((rows) => {
				if (!cancelled) {
					setLedgerAccounts(rows);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setLedgerAccounts([]);
					setErrorMessage(t("dashboard.transferForms.errors.submissionFailed"));
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLedgerAccountsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [activeTransfer, t]);

	const handleTileClick = (type: TransferType) => {
		posthog.capture("transfer_type_selected", {
			transfer_type: type,
		});
		setErrorMessage(null);
		setActiveTransfer(type);
	};

	const handleSubmit = async (payload: TransferPayload) => {
		setErrorMessage(null);
		const result = await submitTransfer(payload);

		if (!result.ok) {
			setErrorMessage(transferErrorMessage(t, result.error.code));
			return;
		}

		posthog.capture("transfer_submitted", {
			transfer_type: payload.type,
			reference_id: result.data.id,
		});

		closeModal();
		setSuccessMessage(t("dashboard.transferForms.success"));
	};

	const modalTitle =
		activeTransfer === "own"
			? t("dashboard.transferForms.ownTitle")
			: activeTransfer === "recipient"
				? t("dashboard.transferForms.recipientTitle")
				: activeTransfer === "tax"
					? t("dashboard.transferForms.taxTitle")
					: "";

	return (
		<>
			<div className="grid grid-cols-3 gap-3">
				{transferActions.map((action) => (
					<button
						key={action.type}
						type="button"
						className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 px-2 py-4 text-center transition-colors hover:border-bank-green/30 hover:bg-bank-green-light"
						onClick={() => handleTileClick(action.type)}
					>
						<div className="flex size-10 items-center justify-center rounded-lg bg-card">
							<action.icon className="size-5 text-bank-green" />
						</div>
						<span className="text-xs font-medium leading-tight text-foreground">
							{t(action.labelKey)}
						</span>
					</button>
				))}
			</div>

			<TransferModal
				open={activeTransfer !== null}
				title={modalTitle}
				onClose={closeModal}
			>
				{errorMessage && (
					<p className="mb-3 text-sm text-destructive" role="alert">
						{errorMessage}
					</p>
				)}

				{activeTransfer === "own" &&
					(ledgerAccountsLoading ? (
						<p className="text-sm text-muted-foreground">
							{t("dashboard.transferForms.loadingAccounts")}
						</p>
					) : (
						<OwnAccountTransferForm
							accounts={ledgerAccounts}
							onCancel={closeModal}
							onSuccess={handleSubmit}
						/>
					))}
				{activeTransfer === "recipient" && (
					<RecipientTransferForm
						accounts={accounts}
						onCancel={closeModal}
						onSuccess={handleSubmit}
					/>
				)}
				{activeTransfer === "tax" && (
					<TaxTransferForm
						accounts={accounts}
						onCancel={closeModal}
						onSuccess={handleSubmit}
					/>
				)}
			</TransferModal>

			{successMessage && (
				<TransferSuccessToast
					message={successMessage}
					onDismiss={() => setSuccessMessage(null)}
				/>
			)}
		</>
	);
}
