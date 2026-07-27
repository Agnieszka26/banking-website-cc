import { usePostHog } from "@posthog/react";
import { useRouter } from "@tanstack/react-router";
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
import { log } from "#/lib/logger";
import { refreshCachesAfterTransfer } from "#/lib/transfers/refresh-caches-after-transfer";
import {
	type SubmitTransferResult,
	submitTransfer,
} from "#/lib/transfers/submit-transfer";
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
	const router = useRouter();
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

		// Product analytics only — no amounts, accounts, IDs, or balances.
		posthog.capture("transfer_submitted", {
			transfer_type: payload.type,
		});

		let result: SubmitTransferResult;
		try {
			result = await submitTransfer(payload);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unexpected transfer submit failure";
			const stack = error instanceof Error ? error.stack : undefined;
			log("error", "transfer.submit.unexpected", {
				transferType: payload.type,
				message,
				stack: stack ?? null,
			});
			posthog.capture("transfer_failed", {
				transfer_type: payload.type,
				error_code: "INTERNAL_ERROR",
			});
			setErrorMessage(t("dashboard.transferForms.errors.submissionFailed"));
			return;
		}

		if (!result.ok) {
			posthog.capture("transfer_failed", {
				transfer_type: payload.type,
				error_code: result.error.code,
			});
			setErrorMessage(transferErrorMessage(t, result.error.code));
			return;
		}

		posthog.capture("transfer_succeeded", {
			transfer_type: payload.type,
		});

		// Best-effort: transfer already committed; refresh must not block success UI.
		try {
			await refreshCachesAfterTransfer(router);
		} catch {
			posthog.capture("transfer_cache_refresh_failed", {
				transfer_type: payload.type,
			});
		}

		// Drop in-memory ledger options so the next open refetches balances.
		setLedgerAccounts([]);

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
