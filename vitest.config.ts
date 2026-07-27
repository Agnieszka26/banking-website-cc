import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	resolve: {
		alias: {
			"#": resolve(__dirname, "src"),
			"@": resolve(__dirname, "src"),
		},
	},
	test: {
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		testTimeout: 30_000,
	},
});
