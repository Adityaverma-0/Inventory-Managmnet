# Client handover and verification record

Verified locally on 8 October 2026. The approved hardening and real-data integration is implemented. This is a tested local handover, not a claim that an Internet deployment or every possible business scenario has been certified.

## Outcome

The connected path is now: supplier PDF → local invoice2data/text extraction or local OCR → editable admin preview → reviewed inventory import → PostgreSQL stock ledger → assigned salesman vehicle stock → server-validated sale → atomic invoice/accounting/stock deduction → refreshed admin and salesman views.

The existing React applications, Express API and PostgreSQL connection are preserved. Purchase Receipts remain a separate workflow. No external AI, external invoice API or invoice-processing API key is used. Demo products and offline mock authentication are no longer used by the production workflow. Legacy local data is preserved in its original IndexedDB database; a separate account-specific database caches server data. Final business mutations require connectivity.

## Fixed

- Scanned PDF support uses local OCR with explicit dependency/error handling; text PDFs retain local extraction. Preview remains mandatory because scans can misread fields.
- Real database-backed admin/salesman sessions, hashed passwords, role checks, active account checks, logout revocation, login throttling and case-insensitive route authorization replace permissive authentication.
- Product, salesman and vehicle forms now match backend field contracts. Master writes use allowlisted columns; assignments cannot change while an active workday uses them.
- Salesman catalog, availability, customers, invoices, ledger and workdays now read the API. Selling is limited to real positive vehicle stock. No assumed ten-box stock or seed catalog is used.
- Load, sale, cancellation, receipt, stock adjustment and unload approval execute transactionally. Sorted stock locks protect concurrent requests; server prices, quantities, day ownership/state and cash reconciliation are validated.
- Request identity protects retries from duplicate invoices, ledger movements and approvals. Purchase import also retains duplicate file/reference checks.
- Admin stock uses the complete ledger semantics. Both dashboards display the central result; invoice product snapshots preserve historical product information.
- Cash review distinguishes notes and coins; errors are shown in core forms, and pending actions prevent common double clicks. Audit records for new operations include the authenticated actor.

## Verification

| Check | Result and evidence |
| --- | --- |
| Admin production build | PASS (`npm run build`) |
| Salesman production build | PASS (`npm --prefix salesman-dashboard run build`) |
| Admin tests | PASS, 13 tests |
| Salesman domain/history tests | PASS, 22 tests |
| Backend invoice import tests | PASS, 6 tests including the opt-in database test |
| Backend production contract regression | PASS, 1 scenario with many assertions; rerun after final backend changes |
| Local extraction/OCR tests | PASS, 19 tests, including supplied `1.pdf` |
| Admin lint | PASS with 59 warnings, zero errors |
| Salesman lint | PASS with 42 warnings, zero errors |
| Browser acceptance | PASS: real PDF extraction/preview/import, load, sale/print, both stock views, cash count, unload request and admin approval |
| Database acceptance | PASS: imported 15 pieces of the tracked product; transferred 10; sold 5; godown/vehicle each showed 5; approved return of 5 leaves godown 10 and vehicle 0 |
| Receipt separation | PASS: PDF test created one inventory import and zero purchase receipts; receipt API independently tested |
| Authorization and retries | PASS: anonymous/wrong login, salesman admin access including uppercase path, wrong state, insufficient stock, price tampering, concurrent overselling, repeated cancellation/approval and logout |
| Browser errors | No console errors captured in the final acceptance tabs |
| Live application restart | PASS: updated API starts on 8000; authenticated admin audit page reads the existing database |
| Data preservation | Acceptance fixtures use disposable schemas. Existing public business inventory was not populated with test products or sales. Existing environment/database connection retained. |

61 tests passed in total across these suites (the end-to-end regression is counted as one test). The first database test attempt timed out; a subsequent complete run passed. Expected negative-test error messages are not production errors. Browser verification was interrupted and resumed; the final unload/approval completed.

## Remaining release limitations

1. Dependency audit is **not clean across the frontends**: admin has 7 advisories (5 high, 2 moderate), salesman has 9 (5 high, 4 moderate), backend has zero. Seven per frontend are the Tailwind 3 build-tool dependency chain (`braces`, `chokidar`, `micromatch`, `fast-glob`, `postcss-nested`, `postcss-selector-parser`, `tailwindcss`). The salesman additionally has two moderate React Router 6 dependency entries. Registry-suggested full fixes require major Tailwind/Router upgrades. These were not forced into the existing UI. Do not expose development servers publicly; resolve and retest these upgrades before an unrestricted production release. Audit counts include transitive dependency entries, not nine independent root flaws.
2. The supplied low-resolution `1.pdf` extracts 35 candidate rows, but OCR accuracy is not guaranteed. The owner must review product matches, quantities, units, prices and totals against the original before saving. Successful extraction is not accounting verification.
3. TLS/reverse proxy, hosting, backups/restore, process supervision, operational monitoring, real account provisioning and representative production load/device testing remain deployment responsibilities. No public deployment was performed.
4. Lint warnings remain (primarily existing broad TypeScript types). Large-history performance and exhaustive browser/device coverage are not certified. Final transactions cannot be completed offline; reconnect and retry using the preserved operation identity.
5. Existing historical audit entries lack actor identity; they are displayed as “Not recorded.” New operations capture it. Startup migration will fail safely if existing duplicate/invalid records violate new constraints, rather than deleting them.

## Startup and operator handover

Follow `README.md` and `backend/invoice_extraction/README.md` for dependencies and configuration. Copy only example environment files when provisioning a new environment; preserve the current private `.env`. Use `npm --prefix backend run migrate`, then `npm --prefix backend run setup:admin` on a fresh installation. The current installation already has the additive migration and administrator configured.

The initial local administrator credential is in `backend/admin-bootstrap.txt` (mode 0600, excluded from Git). Keep it private. Passwords are not reproduced in this report. The backend stores a scrypt hash. Provision real products, godowns, vehicles and assigned salesmen before operating; the production tables intentionally have no acceptance/demo inventory.

Local URLs: admin `http://localhost:5174`, salesman `http://localhost:5173`, API `http://localhost:8000/api/v2`. Both frontend example environments point at that API. Build output is in each application's `dist/` directory. Deployment must serve SPA routes with fallback and run the API separately.

Rollback requires preserving the previous build and a database backup. The migrations are additive; do not drop business tables or overwrite the configured database to roll back application code. Keep the previous IndexedDB store intact.

## File change inventory

Paths are relative to this repository. This inventory distinguishes this approved hardening work from the substantial pre-existing uncommitted backend/salesman/import implementation. Generated `dist`, dependency directories, caches and log files are not source changes. No existing source file was deleted.

### Created for the approved hardening

| File | Reason | Change | Risk |
| --- | --- | --- | --- |
| `backend/security.js` | Replace permissive authentication | Hashed passwords, database sessions, role middleware and throttling | Medium: existing clients must authenticate |
| `backend/operations.js` | Connect real inventory and sales | Validated transactional business endpoints and server snapshots | High: central stock/accounting behavior; regression tested |
| `backend/migrations/002_production_integrity.sql` | Persist security and operation identity | Additive session/idempotency tables, assignment fields and integrity constraints | Medium: invalid legacy records can block migration |
| `backend/setup-admin.js` | Safe initial administrator setup | Creates hash and private bootstrap credential | Medium: keep generated credential private |
| `backend/admin-bootstrap.txt` | Provide initial local login | Private ignored credential file; not a distributable source file | Sensitive: owner-only file |
| `backend/migrate.js` | Repeatable fresh setup | Creates base schema when absent and applies migrations | Medium: database migration |
| `backend/tests/production-integration.test.js` | Verify transactional business contracts | Opt-in isolated database regression | Low: disposable schema only |
| `backend/tests/browser-server.js` | Verify UI without business fixtures | Opt-in isolated acceptance API and cleanup | Low: test-only; never deploy |
| `salesman-dashboard/src/data/catalog.ts` | Remove seed catalog from selling | Server-populated product catalog | Medium: requires successful API load |
| `salesman-dashboard/src/data/realApi.ts` | Replace local-only business writes | Server adapter, cache refresh and retry acknowledgement | High: central data integration; verified |
| `eslint.config.js` | Restore runnable lint checks | Standard ESLint configuration | Low: tooling |
| `.env.example` | Document admin API connection | Non-secret local API example | Low |

### Modified for the approved hardening

| File | Reason | Change | Risk |
| --- | --- | --- | --- |
| `backend/index.js` | Integrate approved backend | Install auth/business routes; preserve extraction/import, bounded OCR, graceful shutdown and actor audit | High: API integration; regression tested |
| `backend/package.json` | Repeatable backend setup | Migration/admin/test scripts and compatible security dependency updates | Low |
| `backend/package-lock.json` | Repeatable backend setup | Migration/admin/test scripts and compatible security dependency updates | Low |
| `backend/.env` | Configure real administrator | Append username and password hash; existing database connection retained | Sensitive: private, ignored |
| `backend/.env.example` | Document server setup | Non-secret database, admin, CORS and OCR configuration | Low |
| `backend/tests/inventory-import.test.js` | Verify protected import API | Authenticated HTTP stubs and database timeout allowance | Low |
| `schema.sql` | Align fresh installations | Assignment/password/workday metadata and invoice product snapshot fields | Medium: fresh database schema |
| `src/App.tsx` | Remove mock auth/data fallback | Session validation, role gating, real API errors, auth headers and retry identity | Medium: connectivity/auth required |
| `src/features/auth/AuthContext.tsx` | Remove mock auth/data fallback | Session validation, role gating, real API errors, auth headers and retry identity | Medium: connectivity/auth required |
| `src/features/auth/Login.tsx` | Remove mock auth/data fallback | Session validation, role gating, real API errors, auth headers and retry identity | Medium: connectivity/auth required |
| `src/features/auth/useApi.ts` | Remove mock auth/data fallback | Session validation, role gating, real API errors, auth headers and retry identity | Medium: connectivity/auth required |
| `src/features/auth/AuthContext.test.tsx` | Keep tests deterministic | Stub logout network request | Low |
| `src/features/admin/ApprovalDashboard.tsx` | Make approval review accurate | Stable fetch dependency and correct note/coin counts | Medium: approval presentation |
| `src/features/admin/AuditLog.tsx` | Render actual audit contract | Numeric timestamps, JSON details and actor fallback | Low |
| `src/features/admin/GodownsPage.tsx` | Handle stock entry and refresh reliably | Form synchronization, real errors and product movement labels | Medium |
| `src/features/admin/SalesmenPage.tsx` | Match secured account API | Real field mapping, 8-character password controls and submission guards | Medium: account management |
| `src/features/admin/VehiclesPage.tsx` | Match real assignments and history | API validation, pending save protection and history labels | Medium |
| `src/features/admin/ProductsPage.tsx` | Pass repository lint | Lint cleanup; existing product form retained | Low |
| `src/features/admin/StockReconcileTable.tsx` | Remove seed metadata dependency | Render product metadata from real stock/report responses | Medium: quantity presentation |
| `src/features/stock/StockSummaryTable.tsx` | Remove seed metadata dependency | Render product metadata from real stock/report responses | Medium: quantity presentation |
| `salesman-dashboard/src/App.tsx` | Initialize real signed-in data | Session validation and server-backed startup/error flow | Medium |
| `salesman-dashboard/src/features/Login.tsx` | Initialize real signed-in data | Session validation and server-backed startup/error flow | Medium |
| `salesman-dashboard/src/data/apiClient.ts` | Make database the source of truth | Authenticated requests, isolated account cache, compatibility adapter and refresh before history | High: persisted data boundary; legacy store preserved |
| `salesman-dashboard/src/data/db.ts` | Make database the source of truth | Authenticated requests, isolated account cache, compatibility adapter and refresh before history | High: persisted data boundary; legacy store preserved |
| `salesman-dashboard/src/data/mockApi.ts` | Make database the source of truth | Authenticated requests, isolated account cache, compatibility adapter and refresh before history | High: persisted data boundary; legacy store preserved |
| `salesman-dashboard/src/data/queryApi.ts` | Make database the source of truth | Authenticated requests, isolated account cache, compatibility adapter and refresh before history | High: persisted data boundary; legacy store preserved |
| `salesman-dashboard/src/features/Home.tsx` | Connect daily operations | Real catalog/state/stock, errors and submission safeguards | High: daily workflow; browser tested |
| `salesman-dashboard/src/features/LoadStock.tsx` | Connect daily operations | Real catalog/state/stock, errors and submission safeguards | High: daily workflow; browser tested |
| `salesman-dashboard/src/features/VehicleStock.tsx` | Connect daily operations | Real catalog/state/stock, errors and submission safeguards | High: daily workflow; browser tested |
| `salesman-dashboard/src/features/Unload.tsx` | Connect daily operations | Real catalog/state/stock, errors and submission safeguards | High: daily workflow; browser tested |
| `salesman-dashboard/src/features/direct-sell/SaleEntry.tsx` | Use actual sellable stock and customers | Server data, positive vehicle quantities, pending sale guard and errors | High: selling; browser and transaction tested |
| `salesman-dashboard/src/features/direct-sell/CustomerSelect.tsx` | Use actual sellable stock and customers | Server data, positive vehicle quantities, pending sale guard and errors | High: selling; browser and transaction tested |
| `salesman-dashboard/src/features/InvoicePrint.tsx` | Preserve historical sales details | Real product snapshots, walk-in fallback, correct date display and error handling | Medium |
| `salesman-dashboard/src/features/Summary.tsx` | Preserve historical sales details | Real product snapshots, walk-in fallback, correct date display and error handling | Medium |
| `salesman-dashboard/src/features/stock/StockSummaryTable.tsx` | Remove seeded product reads | Use central catalog/report metadata | Medium |
| `salesman-dashboard/src/features/admin/StockReconcileTable.tsx` | Remove seeded product reads | Use central catalog/report metadata | Medium |
| `salesman-dashboard/src/domain/dayStockReport.ts` | Remove seeded product reads | Use central catalog/report metadata | Medium |
| `salesman-dashboard/src/domain/types.ts` | Support central product history | Active/name/snapshot fields and no fabricated usual-load quantity | Medium |
| `salesman-dashboard/src/domain/stockLedger.ts` | Support central product history | Active/name/snapshot fields and no fabricated usual-load quantity | Medium |
| `salesman-dashboard/src/domain/rebuildHistory.ts` | Pass existing lint | Const declaration cleanup; history algorithm retained | Low |
| `salesman-dashboard/src/main.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/vite-env.d.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/CashCounter.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/SummaryTabs.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/RouteList.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/CashBreakdownTable.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/customers/CustomerDetail.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/admin/ApprovalDashboard.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/history/CustomerWiseView.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/history/DayReportPrint.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/history/HistoryView.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/history/InvoicesView.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/history/DayWiseView.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/history/HistoryDayDetail.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/features/direct-sell/CustomerAdd.tsx` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/invoice.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/customers.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/cashDenominations.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/money.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/dayState.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/units.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/accounting.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/payments.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `salesman-dashboard/src/domain/stockReconciliation.ts` | Restore lint validation | Lint normalization/unused import cleanup; no intended business rule changes | Low |
| `package.json` | Restore portable build/test tooling | Remove unused/platform-specific direct tooling; compatible updates and Vitest 5; retain framework UI | Medium: dependency updates; builds/tests passed |
| `package-lock.json` | Restore portable build/test tooling | Remove unused/platform-specific direct tooling; compatible updates and Vitest 5; retain framework UI | Medium: dependency updates; builds/tests passed |
| `salesman-dashboard/package.json` | Restore portable build/test tooling | Remove unused/platform-specific direct tooling; compatible updates and Vitest 5; retain framework UI | Medium: dependency updates; builds/tests passed |
| `salesman-dashboard/package-lock.json` | Restore portable build/test tooling | Remove unused/platform-specific direct tooling; compatible updates and Vitest 5; retain framework UI | Medium: dependency updates; builds/tests passed |
| `salesman-dashboard/eslint.config.js` | Run correct checks and local ports | Lint config, admin-only Vitest scope and explicit salesman port | Low |
| `vitest.config.ts` | Run correct checks and local ports | Lint config, admin-only Vitest scope and explicit salesman port | Low |
| `salesman-dashboard/vite.config.ts` | Run correct checks and local ports | Lint config, admin-only Vitest scope and explicit salesman port | Low |
| `.gitignore` | Protect private/generated files | Ignore credentials, environments, caches and Python virtual environment | Low |
| `README.md` | Accurate handover | Real-data setup, verification, configuration and release limitations | Low |
| `salesman-dashboard/README.md` | Accurate handover | Real-data setup, verification, configuration and release limitations | Low |
| `salesman-dashboard/.env.example` | Accurate handover | Real-data setup, verification, configuration and release limitations | Low |
| `system-report.md` | Accurate handover | Real-data setup, verification, configuration and release limitations | Low |

### Earlier PDF/import work retained

The earlier implementation already supplied `src/features/admin/InventoryImport.tsx`, its test, `PurchaseWorkflow.tsx`, `backend/migrations/001_inventory_import.sql`, `backend/invoice_extraction/{extractor.py,local_ocr.py,test_extractor.py,test_ocr.py,requirements.txt,README.md}` and supplier templates. These local extraction/import assets remain in place. The supplied scan and `ideal_invoice.pdf` were used for verification. Existing debug/generator scripts and legacy seed helpers were not blindly deleted. Their presence in an untracked repository is not evidence that the production workflow calls them.

### Deleted files

None. Unused npm dependencies were removed through package manifests/lockfiles, not by deleting existing application features.

### Evidence

Browser screenshots and database proof JSON are saved in the task artifact directory `/Users/eatenapplestores/.codex/visualizations/2026/10/07/01a117c6-1dbe-7881-940c-ecbdc3b4ffc1/`: `verified-test-invoice.png`, `verified-admin-stock.png`, `verified-salesman-stock.png`, `verified-unload-approval.png`, `browser-inventory-proof.json`, and `browser-unload-proof.json`. Screenshots show isolated test data, not client inventory. Automated test commands are in `README.md`.
