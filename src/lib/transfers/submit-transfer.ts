import type { TransferPayload } from "#/components/dashboard/transfers/types";

export type SubmitTransferResult =
	| { ok: true; referenceId: string }
	| { ok: false; error: string };

/**
 * Mock transfer submission — replace with a server function / API call.
 * @example
 * // Later: return createServerFn(...).handler(async ({ data }) => { ... })
 */
export async function submitTransfer(
	payload: TransferPayload,
): Promise<SubmitTransferResult> {
	await new Promise((resolve) => setTimeout(resolve, 400));

	if (import.meta.env.DEV) {
		console.info("[transfer:mock]", payload);
	}

	return {
		ok: true,
		referenceId: `TR-${Date.now()}`,
	};
}
