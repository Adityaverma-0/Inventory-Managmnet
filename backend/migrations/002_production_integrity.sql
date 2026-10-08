ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS godown_id VARCHAR(50) REFERENCES godowns(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE salesmen ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR(50) REFERENCES vehicles(id);
ALTER TABLE salesmen ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
ALTER TABLE salesmen ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE work_days ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE work_days ADD COLUMN IF NOT EXISTS request_data JSONB;
ALTER TABLE work_days ADD COLUMN IF NOT EXISTS requested_at BIGINT;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_snapshot JSONB;
CREATE TABLE IF NOT EXISTS api_operations (
  actor_id VARCHAR(60) NOT NULL, request_key VARCHAR(100) NOT NULL,
  operation VARCHAR(120) NOT NULL, payload_hash VARCHAR(64) NOT NULL,
  response JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(actor_id, request_key)
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash VARCHAR(64) PRIMARY KEY, user_id VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK(role IN ('admin','salesman')),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS salesmen_phone_unique ON salesmen(phone);
CREATE UNIQUE INDEX IF NOT EXISTS work_days_active_vehicle ON work_days(vehicle_id) WHERE state <> 'CLOSED';
CREATE UNIQUE INDEX IF NOT EXISTS work_days_active_salesman ON work_days(salesman_id) WHERE state <> 'CLOSED';
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'inventory_imports'::regclass AND conname = 'inventory_imports_godown_fk') THEN
  ALTER TABLE inventory_imports ADD CONSTRAINT inventory_imports_godown_fk FOREIGN KEY (godown_id) REFERENCES godowns(id) NOT VALID;
 END IF;
END $$;
ALTER TABLE inventory_imports VALIDATE CONSTRAINT inventory_imports_godown_fk;
