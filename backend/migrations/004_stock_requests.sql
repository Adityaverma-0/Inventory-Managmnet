CREATE TABLE IF NOT EXISTS stock_requests (
    id VARCHAR(50) PRIMARY KEY,
    work_day_id VARCHAR(50) REFERENCES work_days(work_day_id),
    salesman_id VARCHAR(50) REFERENCES salesmen(id),
    vehicle_id VARCHAR(50) REFERENCES vehicles(id),
    godown_id VARCHAR(50) REFERENCES godowns(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    items JSONB NOT NULL,
    requested_at BIGINT NOT NULL,
    processed_at BIGINT,
    admin_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_stock_requests_status ON stock_requests(status);
CREATE INDEX IF NOT EXISTS idx_stock_requests_salesman ON stock_requests(salesman_id);
CREATE INDEX IF NOT EXISTS idx_stock_requests_workday ON stock_requests(work_day_id);
