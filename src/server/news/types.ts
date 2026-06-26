export type NewsItem = {
	id: string;
	created_at: string;
	title: string;
	subtitle: string;
	body: string | null;
	category: string | null;
	slug: string;
};
