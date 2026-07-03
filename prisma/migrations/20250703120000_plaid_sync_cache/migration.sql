-- Plaid sync cache tables (Phase 1 scale path: DB-backed dashboard reads).

CREATE TABLE IF NOT EXISTS public.plaid_cached_accounts (
  plaid_account_id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.plaid_link(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  mask text NOT NULL,
  balance numeric(14, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PLN',
  type text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plaid_cached_accounts_user_id_idx
  ON public.plaid_cached_accounts (user_id);

CREATE TABLE IF NOT EXISTS public.plaid_cached_transactions (
  plaid_transaction_id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.plaid_link(user_id) ON DELETE CASCADE,
  plaid_account_id text NOT NULL,
  date text NOT NULL,
  name text NOT NULL,
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PLN',
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plaid_cached_transactions_user_id_idx
  ON public.plaid_cached_transactions (user_id);

CREATE INDEX IF NOT EXISTS plaid_cached_transactions_user_date_idx
  ON public.plaid_cached_transactions (user_id, date DESC);

ALTER TABLE public.plaid_link
  ADD COLUMN IF NOT EXISTS item_id text,
  ADD COLUMN IF NOT EXISTS accounts_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS transactions_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_error text;

ALTER TABLE public.plaid_cached_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_cached_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plaid_cached_accounts_own_data ON public.plaid_cached_accounts;
CREATE POLICY plaid_cached_accounts_own_data ON public.plaid_cached_accounts
  FOR ALL
  TO authenticated
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

DROP POLICY IF EXISTS plaid_cached_accounts_service_role ON public.plaid_cached_accounts;
CREATE POLICY plaid_cached_accounts_service_role ON public.plaid_cached_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS plaid_cached_transactions_own_data ON public.plaid_cached_transactions;
CREATE POLICY plaid_cached_transactions_own_data ON public.plaid_cached_transactions
  FOR ALL
  TO authenticated
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

DROP POLICY IF EXISTS plaid_cached_transactions_service_role ON public.plaid_cached_transactions;
CREATE POLICY plaid_cached_transactions_service_role ON public.plaid_cached_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plaid_cached_accounts TO banking_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plaid_cached_transactions TO banking_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plaid_cached_accounts TO banking_app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plaid_cached_transactions TO banking_app_runtime;
