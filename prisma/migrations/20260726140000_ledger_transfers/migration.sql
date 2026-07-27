-- Own-account transfer records (multi-leg parent for ledger_transactions.transfer_id).

CREATE TABLE IF NOT EXISTS public.ledger_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  source_account_id uuid NOT NULL REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  destination_account_id uuid NOT NULL REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_transfers_amount_minor_positive CHECK (amount_minor > 0),
  CONSTRAINT ledger_transfers_amount_minor_safe CHECK (
    amount_minor <= 9007199254740991
  ),
  CONSTRAINT ledger_transfers_accounts_differ CHECK (source_account_id <> destination_account_id)
);

-- Align with ledger_accounts / ledger_transactions (bigint minor units).
ALTER TABLE public.ledger_transfers
  ALTER COLUMN amount_minor TYPE bigint;

ALTER TABLE public.ledger_transactions
  DROP CONSTRAINT IF EXISTS ledger_transactions_transfer_id_fkey;

ALTER TABLE public.ledger_transactions
  ADD CONSTRAINT ledger_transactions_transfer_id_fkey
  FOREIGN KEY (transfer_id)
  REFERENCES public.ledger_transfers(id)
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS ledger_transfers_user_created_idx
  ON public.ledger_transfers (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ledger_transfers_dedup_idx
  ON public.ledger_transfers (
    user_id,
    source_account_id,
    destination_account_id,
    amount_minor,
    currency,
    title,
    created_at
  );

ALTER TABLE public.ledger_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transfers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ledger_transfers_own_data ON public.ledger_transfers;
CREATE POLICY ledger_transfers_own_data ON public.ledger_transfers
  FOR ALL
  TO authenticated
  USING (
    user_id = current_app_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.ledger_accounts a
      WHERE a.id = ledger_transfers.source_account_id
        AND a.user_id = current_app_user_id()
    )
    AND EXISTS (
      SELECT 1
      FROM public.ledger_accounts a
      WHERE a.id = ledger_transfers.destination_account_id
        AND a.user_id = current_app_user_id()
    )
  )
  WITH CHECK (
    user_id = current_app_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.ledger_accounts a
      WHERE a.id = ledger_transfers.source_account_id
        AND a.user_id = current_app_user_id()
    )
    AND EXISTS (
      SELECT 1
      FROM public.ledger_accounts a
      WHERE a.id = ledger_transfers.destination_account_id
        AND a.user_id = current_app_user_id()
    )
  );

GRANT SELECT, INSERT ON public.ledger_transfers TO banking_app;
GRANT SELECT, INSERT ON public.ledger_transfers TO banking_app_runtime;
DROP POLICY IF EXISTS ledger_transfers_service_role ON public.ledger_transfers;
CREATE POLICY ledger_transfers_service_role ON public.ledger_transfers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_transfers TO banking_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_transfers TO banking_app_runtime;
