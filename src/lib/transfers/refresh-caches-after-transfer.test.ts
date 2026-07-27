import { describe, expect, it, vi } from "vitest";
import { refreshCachesAfterTransfer } from "./refresh-caches-after-transfer";

describe("refreshCachesAfterTransfer", () => {
	it("invalidates route loaders once without mutating cache data", async () => {
		const invalidate = vi.fn().mockResolvedValue(undefined);
		await refreshCachesAfterTransfer({ invalidate });
		expect(invalidate).toHaveBeenCalledTimes(1);
	});
});
