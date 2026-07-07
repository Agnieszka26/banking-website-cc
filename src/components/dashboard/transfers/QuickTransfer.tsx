import { usePostHog } from "@posthog/react";
import { Building2, User, Wallet } from "lucide-react";
import { useCallback, useState } from "react";
import { OwnAccountTransferForm } from "#/components/dashboard/transfers/OwnAccountTransferForm";
import { RecipientTransferForm } from "#/components/dashboard/transfers/RecipientTransferForm";
import { TaxTransferForm } from "#/components/dashboard/transfers/TaxTransferForm";
import { TransferModal } from "#/components/dashboard/transfers/TransferModal";
import { TransferSuccessToast } from "#/components/dashboard/transfers/TransferSuccessToast";
import type {
	TransferPayload,
	TransferType,
} from "#/components/dashboard/transfers/types";
import { useTranslation } from "#/lib/i18n";
import { submitTransfer } from "#/lib/transfers/submit-transfer";
import type { DashboardAccount } from "#/server/plaid";

const transferActions = [
	{ type: "own" as const, labelKey: "dashboard.transfer.toOwnAccount", icon: Wallet },
	{
		type: "recipient" as const,
		labelKey: "dashboard.transfer.toRecipient",
		icon: User,
	},
	{ type: "tax" as const, labelKey: "dashboard.transfer.taxes", icon: Building2 },
] as const;

type QuickTransferProps = {
	accounts: DashboardAccount[];
};

export function QuickTransfer({ accounts }: QuickTransferProps) {
	const t = useTranslation();
	const posthog = usePostHog();
	const [activeTransfer, setActiveTransfer] = useState<TransferType | null>(
		null,
	);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const closeModal = useCallback(() => {
		setActiveTransfer(null);
	}, []);

	const handleTileClick = (type: TransferType, labelKey: string) => {
		posthog.capture("transfer_type_selected", {
			transfer_type: t(labelKey),
		});
		setActiveTransfer(type);
	};

	const handleSubmit = async (payload: TransferPayload) => {
		const result = await submitTransfer(payload);

		if (!result.ok) {
			return;
		}

		posthog.capture("transfer_submitted", {
			transfer_type: payload.type,
			reference_id: result.referenceId,
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
						onClick={() => handleTileClick(action.type, action.labelKey)}
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
				{activeTransfer === "own" && (
					<OwnAccountTransferForm
						accounts={accounts}
						onCancel={closeModal}
						onSuccess={handleSubmit}
					/>
				)}
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
