import { pool } from './backend/index.js';

async function migrate() {
    console.log("Running migration...");
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                id VARCHAR(50) PRIMARY KEY,
                data JSONB NOT NULL DEFAULT '{}'::jsonb
            );
            INSERT INTO app_settings (id, data) VALUES ('tax', '{"cgst": 0, "sgst": 0}'::jsonb) ON CONFLICT (id) DO NOTHING;

            ALTER TABLE invoices
            ADD COLUMN IF NOT EXISTS cgst_percent NUMERIC(5,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS sgst_percent NUMERIC(5,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS cgst_amount_paise BIGINT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS sgst_amount_paise BIGINT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS subtotal_paise BIGINT DEFAULT 0;
            
            UPDATE invoices SET subtotal_paise = total_amount_paise WHERE subtotal_paise = 0;
        `);
        console.log("Migration successful");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}
migrate();
