-- Internal account identity: application-domain IBAN on ledger_accounts.
-- Plaid never supplies this value; it is generated at account provisioning.

ALTER TABLE public.ledger_accounts
  ADD COLUMN IF NOT EXISTS iban text;

-- Backfill existing rows before enforcing NOT NULL / UNIQUE.
DO $$
DECLARE
  row_record record;
  serial text;
  bban text;
  rearranged text;
  expanded text;
  ch text;
  remainder integer;
  i integer;
  check_digits text;
  candidate text;
  attempt integer;
BEGIN
  FOR row_record IN
    SELECT id
    FROM public.ledger_accounts
    WHERE iban IS NULL
  LOOP
    attempt := 0;
    LOOP
      attempt := attempt + 1;
      serial := lpad((floor(random() * 1e16))::bigint::text, 16, '0');
      bban := '10901014' || serial;
      rearranged := bban || 'PL00';
      expanded := '';
      FOR i IN 1..length(rearranged) LOOP
        ch := substr(rearranged, i, 1);
        IF ch ~ '[A-Z]' THEN
          expanded := expanded || (ascii(ch) - 55)::text;
        ELSE
          expanded := expanded || ch;
        END IF;
      END LOOP;

      remainder := 0;
      FOR i IN 1..length(expanded) LOOP
        remainder := (remainder * 10 + substr(expanded, i, 1)::integer) % 97;
      END LOOP;
      check_digits := lpad((98 - remainder)::text, 2, '0');
      candidate := 'PL' || check_digits || bban;

      BEGIN
        UPDATE public.ledger_accounts
        SET iban = candidate
        WHERE id = row_record.id;
        EXIT;
      EXCEPTION
        WHEN unique_violation THEN
          IF attempt >= 20 THEN
            RAISE;
          END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.ledger_accounts
  ALTER COLUMN iban SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ledger_accounts_iban_uidx
  ON public.ledger_accounts (iban);

COMMENT ON COLUMN public.ledger_accounts.iban IS
  'Application-domain Polish IBAN (PL + 26 digits). Source of account identity; not from Plaid.';
