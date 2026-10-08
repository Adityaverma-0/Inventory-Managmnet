# Salesman dashboard

This application uses authenticated server operations for work days, real inventory, loading, sales, cancellation, customers and unload submissions. It shares the existing PostgreSQL ledger with Admin. Production does not run seedInitialData or sell sample products.

See the [project setup and stock workflow](../README.md). Configure `VITE_API_BASE_URL` from `.env.example`. Admin must assign an active vehicle and godown to an active salesman and set their password before they can start a work day.

IndexedDB stores an account-specific server cache and cash drafts. Legacy data remains untouched in the old browser database. Reconnect before committing stock changes; rejected or unconfirmed requests display an error and must not be treated as completed sales.

Run `npm run dev` (port 5173), `npm run lint`, `npm run build`, and `npm test`. Do not deploy the opt-in acceptance server or its test credentials.
