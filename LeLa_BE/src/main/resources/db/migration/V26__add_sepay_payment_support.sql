ALTER TABLE payments ADD COLUMN payment_code VARCHAR(50) UNIQUE;
ALTER TABLE payments MODIFY provider_transaction_id VARCHAR(190) NULL;
ALTER TABLE payments ADD CONSTRAINT uk_provider_transaction UNIQUE (provider_transaction_id);
ALTER TABLE payments ADD COLUMN expires_at DATETIME(6);
