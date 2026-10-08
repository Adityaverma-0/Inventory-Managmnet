# Admin and salesman dashboards

React admin and salesman applications share the existing Express/PostgreSQL inventory and accounting ledgers. PDF processing runs locally with invoice2data, PDFium and Tesseract. No invoice API key or external AI service is required.

## Setup

Use a current supported Node.js LTS version and Python 3. Install dependencies with `npm ci`, `npm --prefix backend ci`, and `npm --prefix salesman-dashboard ci`. Copy each application's `.env.example` to `.env` and supply the PostgreSQL connection string only in `backend/.env`. Set frontend API URLs to the deployment API, not localhost, when deploying. Restrict `CORS_ORIGINS` to the actual dashboard origins.

Run `npm --prefix backend run migrate` against an empty database for first installation, or an existing database for additive migrations. Back up an existing database first. Migrations never delete business records; incompatible existing assignments/constraints cause a visible failure rather than silently discarding records. Start the backend only after migration succeeds.

Run `npm --prefix backend run setup:admin` once. This creates a random initial admin credential in `backend/admin-bootstrap.txt` with owner-only filesystem permissions, and stores its scrypt hash in `backend/.env`. Both files are excluded from Git. Keep the credential private. To provision a chosen replacement credential, set `ADMIN_PASSWORD_HASH` using the exported `hashPassword` helper in `backend/security.js`, restart the API and revoke existing admin sessions through a controlled maintenance operation. No default password is embedded in the application.

Follow [local PDF extraction setup](backend/invoice_extraction/README.md) to install the Python virtual environment and Tesseract. OCR can misread low-resolution scans: review every extracted quantity, unit, price and product match before saving.

## Run locally

- `npm --prefix backend run dev`: API on port 8000.
- `npm run dev`: admin on port 5174.
- `npm --prefix salesman-dashboard run dev`: salesman on port 5173.

Create actual products and godowns in Admin, then assign vehicles to godowns and salesmen to vehicles. Set a salesman password with at least eight characters. No products, customers or inventory are automatically seeded into the business database or the salesman selling workflow.

## Stock and receipts

PDF extraction is read-only. **Save to Inventory** records the reviewed import and adds stock to the selected godown atomically, without creating a purchase receipt. Purchase receipts remain a separate workflow.

Vehicle loading transfers stock from godown to vehicle. Sales deduct vehicle stock; do not deduct the same units from godown again. Admin Godowns and Vehicles show their respective balances. Unload approval returns counted unloaded items to the godown, retains held items in the vehicle, and closes the work day after cash/stock validation. Cancellations create one reversal. All stock-changing server requests validate the current balance in a transaction and use idempotency keys for retries.

The salesman database in the browser is an account-specific read cache and cash-draft store. Existing legacy browser history is retained in its original database and is never treated as central stock. Stock-changing operations require a server response; there is no offline sale-commit mode.

## Checks

- `npm run lint` and `npm run build`
- `npm test`
- `npm --prefix salesman-dashboard run lint`, `npm --prefix salesman-dashboard run build`, `npm --prefix salesman-dashboard test`
- `npm --prefix backend test`
- `INVOICE_TEST_SCAN=/absolute/path/to/scan.pdf backend/invoice_extraction/venv/bin/python -B -m unittest discover -s backend/invoice_extraction -p 'test_*.py'`

Database tests are opt-in. Set `TEST_DATABASE_URL` for the invoice integration test. Set `RUN_ISOLATED_DB_TESTS=1` for `backend/tests/production-integration.test.js`; it uses TEST_DATABASE_URL or the configured database, creates a unique disposable schema and removes only that schema on completion. Never point a test at a database user that cannot create isolated schemas and expect it to write into public tables.

`RUN_BROWSER_ACCEPTANCE=1 node backend/tests/browser-server.js` starts a localhost-only acceptance API on port 8100 with its own disposable schema and private temporary test credentials. Start separate frontend previews with `VITE_API_BASE_URL=http://localhost:8100/api/v2` on ports 5175/5176. Stop the acceptance server with SIGTERM/SIGINT so it removes its own schema. This harness is not a production server.

## Deployment

Build both frontends and serve their dist directories with SPA fallback. Run `npm --prefix backend start` under the existing process supervisor. Configure TLS at the existing reverse proxy, backend environment, database access, Python executable and OCR dependencies. No new hosting infrastructure is required. Apply migrations before serving traffic; preserve a database backup and the previous application build for rollback. Review the current handover report for tested scope and remaining dependency advisories.
