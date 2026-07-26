import { describe, expect, it } from "vitest";
import { AppError, toAppError, toErrorResponse } from "#/lib/errors";

describe("AppError", () => {
	it("exposes typed UNAUTHORIZED with HTTP 401", () => {
		const error = new AppError("UNAUTHORIZED", "Authentication required.");
		expect(error.code).toBe("UNAUTHORIZED");
		expect(error.httpStatus).toBe(401);
	});

	it("maps FORBIDDEN, VALIDATION_ERROR, ACCOUNT_NOT_FOUND, INTERNAL_ERROR", () => {
		expect(new AppError("FORBIDDEN", "Nope").httpStatus).toBe(403);
		expect(new AppError("VALIDATION_ERROR", "Bad").httpStatus).toBe(400);
		expect(new AppError("ACCOUNT_NOT_FOUND", "Missing").httpStatus).toBe(404);
		expect(new AppError("INTERNAL_ERROR", "Boom").httpStatus).toBe(500);
	});

	it("serializes the API error envelope", async () => {
		const response = new AppError(
			"UNAUTHORIZED",
			"Authentication required.",
		).toResponse();
		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			error: {
				code: "UNAUTHORIZED",
				message: "Authentication required.",
			},
		});
	});

	it("never leaks raw database errors to clients", async () => {
		const mapped = toAppError(new Error("relation does not exist"));
		expect(mapped.code).toBe("INTERNAL_ERROR");
		expect(mapped.message).toBe("An unexpected error occurred.");

		const response = toErrorResponse(new Error("ECONNREFUSED"));
		await expect(response.json()).resolves.toEqual({
			error: {
				code: "INTERNAL_ERROR",
				message: "An unexpected error occurred.",
			},
		});
	});
});
