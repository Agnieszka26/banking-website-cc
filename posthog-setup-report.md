# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into the TanStack Start banking application. Changes span client-side event tracking, server-side event capture, user identification via Clerk, a reverse proxy configuration for reliable ingestion, and a PostHog dashboard with five ready-to-use insights.

## Files changed

| File | Change summary |
|------|---------------|
| `src/routes/__root.tsx` | Added `PostHogProvider` wrapping the entire app in `RootDocument`; configured reverse proxy host and exception capture |
| `vite.config.ts` | Added EU PostHog reverse proxy rules for `/ingest`, `/ingest/static`, `/ingest/array` |
| `src/utils/posthog-server.ts` | **New file** — singleton `getPostHogClient()` for server-side `posthog-node` capture |
| `.env` | Added `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` |
| `src/components/LoginForm.tsx` | Captures `login_started` and `login_help_clicked` on link clicks |
| `src/routes/dashboard/route.tsx` | Calls `posthog.identify()` with Clerk user ID, email, and name on every authenticated dashboard visit |
| `src/components/dashboard/ConnectBankAccount.tsx` | Captures `bank_account_connect_opened`, `bank_account_connected`, and `bank_account_connect_failed` around the Plaid link flow |
| `src/routes/dashboard/index.tsx` | Captures `transfer_type_selected`, `transfer_initiated`, `transfer_history_viewed`, `dashboard_message_opened`, and `dashboard_shortcut_clicked` |
| `src/routes/dashboard/accounts/$accountId.tsx` | Captures `account_details_viewed` (with `account_type` and `account_mask` properties) on mount |
| `src/server/plaid/functions.ts` | Captures server-side `bank_account_token_exchanged` after Plaid public token exchange succeeds |

## Events tracked

| Event name | Description | File |
|-----------|-------------|------|
| `login_started` | User clicks the 'Dalej' (Next) button on the home login form | `src/components/LoginForm.tsx` |
| `login_help_clicked` | User clicks the 'pomoc w logowaniu' (login help) link | `src/components/LoginForm.tsx` |
| `bank_account_connect_opened` | User clicks 'Połącz konto przez Plaid' to open Plaid link flow | `src/components/dashboard/ConnectBankAccount.tsx` |
| `bank_account_connected` | User successfully linked a bank account via Plaid | `src/components/dashboard/ConnectBankAccount.tsx` |
| `bank_account_connect_failed` | Error occurred during the Plaid bank account linking flow | `src/components/dashboard/ConnectBankAccount.tsx` |
| `transfer_type_selected` | User selects a transfer type in the quick transfer panel | `src/routes/dashboard/index.tsx` |
| `transfer_initiated` | User clicks 'Wykonaj przelew' (Execute transfer) button | `src/routes/dashboard/index.tsx` |
| `transfer_history_viewed` | User clicks 'Historia przelewów' (Transfer history) link | `src/routes/dashboard/index.tsx` |
| `account_details_viewed` | User navigates to a specific account's details page | `src/routes/dashboard/accounts/$accountId.tsx` |
| `dashboard_shortcut_clicked` | User clicks a quick-action shortcut tile | `src/routes/dashboard/index.tsx` |
| `dashboard_message_opened` | User clicks a message/notification in the Messages panel | `src/routes/dashboard/index.tsx` |
| `bank_account_token_exchanged` | Server: Plaid public token successfully exchanged for access token | `src/server/plaid/functions.ts` |

## Next steps

A dashboard and five insights were created in PostHog to monitor user behavior immediately once events start flowing:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/204859/dashboard/757750)
- [Login Activity](https://eu.posthog.com/project/204859/insights/QmuuGr4J) — Daily `login_started` trend
- [Bank Connection Funnel](https://eu.posthog.com/project/204859/insights/DljaBf4P) — Steps: login started → Plaid opened → bank connected
- [Bank Connection Success Rate](https://eu.posthog.com/project/204859/insights/a8VPxFdI) — `bank_account_connected / bank_account_connect_opened × 100`
- [Transfer Initiations](https://eu.posthog.com/project/204859/insights/8m94WhlC) — Daily unique users clicking execute transfer
- [Dashboard Engagement](https://eu.posthog.com/project/204859/insights/YlVT69p8) — Transfer type selections, shortcuts, and message opens over time

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the current implementation identifies on every authenticated dashboard visit via `useEffect`, which covers returning sessions, but verify this behaves correctly after a page refresh with an active Clerk session.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
