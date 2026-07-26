-- Application ledger tables (system of record).
-- Separate from legacy `accounts` / `transactions` and Plaid cache tables.

CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  currency char(3) NOT NULL,
  balance_minor bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_accounts_balance_minor_non_negative CHECK (balance_minor >= 0)
);

CREATE INDEX IF NOT EXISTS ledger_accounts_user_id_idx
  ON public.ledger_accounts (user_id);

CREATE TABLE IF NOT EXISTS public.ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  direction text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  counterparty_name text,
  counterparty_account_number text,
  transfer_id uuid,
  booking_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_transactions_amount_minor_positive CHECK (amount_minor > 0),
  CONSTRAINT ledger_transactions_direction_check CHECK (direction IN ('debit', 'credit'))
);

CREATE INDEX IF NOT EXISTS ledger_transactions_account_booking_idx
  ON public.ledger_transactions (account_id, booking_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS ledger_transactions_transfer_id_idx
  ON public.ledger_transactions (transfer_id);

ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ledger_accounts_own_data ON public.ledger_accounts;
CREATE POLICY ledger_accounts_own_data ON public.ledger_accounts
  FOR ALL
  TO authenticated
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

DROP POLICY IF EXISTS ledger_accounts_service_role ON public.ledger_accounts;
CREATE POLICY ledger_accounts_service_role ON public.ledger_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS ledger_transactions_own_data ON public.ledger_transactions;
CREATE POLICY ledger_transactions_own_data ON public.ledger_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ledger_accounts a
      WHERE a.id = ledger_transactions.account_id
        AND a.user_id = current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ledger_accounts a
      WHERE a.id = ledger_transactions.account_id
        AND a.user_id = current_app_user_id()
    )
  );

DROP POLICY IF EXISTS ledger_transactions_service_role ON public.ledger_transactions;
CREATE POLICY ledger_transactions_service_role ON public.ledger_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_accounts TO banking_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_transactions TO banking_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_accounts TO banking_app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_transactions TO banking_app_runtime;
