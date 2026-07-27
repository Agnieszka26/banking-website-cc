import { beforeEach, describe, expect, it, vi } from "vitest";

const withUserRlsContextMock = vi.fn();

vi.mock("#/lib/prisma-rls", () => ({
	withUserRlsContext: (...args: unknown[]) => withUserRlsContextMock(...args),
}));

import { transferRepository } from "./transfer.repository";

describe("transferRepository.createTransfer duplicate check timing", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("runs findFirst duplicate lookup on the same tx after account locks", async () => {
		const callOrder: string[] = [];
		const existingId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
		const legIds = [
			"11111111-1111-1111-1111-111111111111",
			"22222222-2222-2222-2222-222222222222",
		];

		const tx = {
			$queryRaw: vi
				.fn()
				.mockImplementationOnce(async () => {
					callOrder.push("lock");
					return [
						{
							id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001",
							balance_minor: 50_000n,
							currency: "PLN",
						},
					];
				})
				.mockImplementationOnce(async () => {
					callOrder.push("lock");
					return [
						{
							id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002",
							balance_minor: 10_000n,
							currency: "PLN",
						},
					];
				}),
			ledgerTransfer: {
				findFirst: vi.fn(async () => {
					callOrder.push("duplicate_findFirst");
					return {
						id: existingId,
						userId: "user-a",
						sourceAccountId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001",
						destinationAccountId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002",
						amountMinor: 1000n,
						currency: "PLN",
						title: "Move",
						createdAt: new Date("2026-07-26T12:00:00.000Z"),
					};
				}),
				create: vi.fn(async () => {
					callOrder.push("transfer_create");
					throw new Error("should not create when duplicate exists");
				}),
			},
			ledgerTransaction: {
				findMany: vi.fn(async () => {
					callOrder.push("duplicate_legs");
					return legIds.map((id) => ({ id }));
				}),
				create: vi.fn(async () => {
					callOrder.push("leg_create");
					throw new Error("should not create legs when duplicate exists");
				}),
			},
			ledgerAccount: {
				updateMany: vi.fn(),
				update: vi.fn(),
			},
		};

		withUserRlsContextMock.mockImplementation(
			async (_userId: string, fn: (client: typeof tx) => Promise<unknown>) =>
				fn(tx),
		);

		const result = await transferRepository.createTransfer({
			userId: "user-a",
			input: {
				sourceAccountId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001",
				destinationAccountId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002",
				amountMinor: 1000,
				currency: "PLN",
				title: "Move",
			},
		});

		expect(result.deduplicated).toBe(true);
		expect(result.transfer.id).toBe(existingId);
		expect(result.transfer.transactionIds).toEqual(legIds);
		expect(tx.ledgerTransfer.findFirst).toHaveBeenCalled();
		expect(tx.ledgerTransfer.create).not.toHaveBeenCalled();
		expect(callOrder).toEqual([
			"lock",
			"lock",
			"duplicate_findFirst",
			"duplicate_legs",
		]);
	});
});
