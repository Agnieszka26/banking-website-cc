import { createServerFn } from "@tanstack/react-start";
import { supabase } from "#/server/supabase/client";
import type { NewsItem } from "./types";

export const getNews = createServerFn({ method: "GET" }).handler(
	async (): Promise<NewsItem[]> => {
		const { data, error } = await supabase
			.from("news")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch news: ${error.message}`);
		}

		return data ?? [];
	},
);

export const getNewsById = createServerFn({ method: "GET" })
	.validator((newsId: string) => {
		if (typeof newsId !== "string" || newsId.trim().length === 0) {
			throw new Error("Invalid news id");
		}
		return newsId;
	})
	.handler(async ({ data: newsId }): Promise<NewsItem | null> => {
		const { data, error } = await supabase
			.from("news")
			.select("*")
			.eq("id", newsId)
			.maybeSingle();

		if (error) {
			throw new Error(`Failed to fetch news item: ${error.message}`);
		}

		return data;
	});
