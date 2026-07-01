import "@tanstack/react-start/server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
	throw new Error(
		"Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in your .env file.",
	);
}

/** Supabase client for public/server reads (subject to RLS; not service role). */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
});
