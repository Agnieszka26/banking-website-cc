import "@tanstack/react-start/server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
	throw new Error(
		"Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SECRET_KEY in your .env file.",
	);
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
});
