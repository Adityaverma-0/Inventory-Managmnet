-- Run in one transaction. Do not silently merge existing duplicate imports.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM inventory_imports
    GROUP BY lower(regexp_replace(btrim(import_ref), '\s+', '', 'g'))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existing normalized invoice references are duplicated. Review them before applying this migration.';
  END IF;
END $$;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS uom VARCHAR(30);
ALTER TABLE godowns ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE inventory_imports ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE inventory_imports ADD COLUMN IF NOT EXISTS supplier_gstin VARCHAR(15);
ALTER TABLE inventory_imports ADD COLUMN IF NOT EXISTS reviewed_lines JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS inventory_imports_normalized_ref_key
ON inventory_imports (lower(regexp_replace(btrim(import_ref), '\s+', '', 'g')));
