-- Row Level Security for Better Auth user ids (app.current_user_id session setting).
-- Service role retains full access for server-side admin operations.

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '');
$$;

DO $$
BEGIN
  CREATE ROLE banking_app NOINHERIT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

GRANT USAGE ON SCHEMA public TO banking_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO banking_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO banking_app;
GRANT banking_app TO authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on every public app table
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_own_data ON public.profiles;
CREATE POLICY profiles_own_data ON public.profiles
  FOR ALL
  TO authenticated
  USING ("user_UID" = current_app_user_id())
  WITH CHECK ("user_UID" = current_app_user_id());

DROP POLICY IF EXISTS profiles_service_role ON public.profiles;
CREATE POLICY profiles_service_role ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- accounts (bank accounts)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS accounts_own_data ON public.accounts;
CREATE POLICY accounts_own_data ON public.accounts
  FOR ALL
  TO authenticated
  USING ("user_UID" = current_app_user_id())
  WITH CHECK ("user_UID" = current_app_user_id());

DROP POLICY IF EXISTS accounts_service_role ON public.accounts;
CREATE POLICY accounts_service_role ON public.accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- transactions (owned via linked bank account)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS transactions_own_data ON public.transactions;
CREATE POLICY transactions_own_data ON public.transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.accounts a
      WHERE a.account_id = transactions.account_id
        AND a."user_UID" = current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.accounts a
      WHERE a.account_id = transactions.account_id
        AND a."user_UID" = current_app_user_id()
    )
  );

DROP POLICY IF EXISTS transactions_service_role ON public.transactions;
CREATE POLICY transactions_service_role ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- plaid_link
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS plaid_link_own_data ON public.plaid_link;
CREATE POLICY plaid_link_own_data ON public.plaid_link
  FOR ALL
  TO authenticated
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

DROP POLICY IF EXISTS plaid_link_service_role ON public.plaid_link;
CREATE POLICY plaid_link_service_role ON public.plaid_link
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Better Auth: user
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS user_select_own ON public."user";
CREATE POLICY user_select_own ON public."user"
  FOR SELECT
  TO authenticated
  USING (id = current_app_user_id());

DROP POLICY IF EXISTS user_update_own ON public."user";
CREATE POLICY user_update_own ON public."user"
  FOR UPDATE
  TO authenticated
  USING (id = current_app_user_id())
  WITH CHECK (id = current_app_user_id());

DROP POLICY IF EXISTS user_service_role ON public."user";
CREATE POLICY user_service_role ON public."user"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Better Auth: session
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS session_own_data ON public.session;
CREATE POLICY session_own_data ON public.session
  FOR ALL
  TO authenticated
  USING ("userId" = current_app_user_id())
  WITH CHECK ("userId" = current_app_user_id());

DROP POLICY IF EXISTS session_service_role ON public.session;
CREATE POLICY session_service_role ON public.session
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Better Auth: account (OAuth / credential provider)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS account_own_data ON public.account;
CREATE POLICY account_own_data ON public.account
  FOR ALL
  TO authenticated
  USING ("userId" = current_app_user_id())
  WITH CHECK ("userId" = current_app_user_id());

DROP POLICY IF EXISTS account_service_role ON public.account;
CREATE POLICY account_service_role ON public.account
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Better Auth: verification (server-only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS verification_service_role ON public.verification;
CREATE POLICY verification_service_role ON public.verification
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- news (public read, server-managed writes)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS news_public_read ON public.news;
CREATE POLICY news_public_read ON public.news
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS news_service_role ON public.news;
CREATE POLICY news_service_role ON public.news
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
