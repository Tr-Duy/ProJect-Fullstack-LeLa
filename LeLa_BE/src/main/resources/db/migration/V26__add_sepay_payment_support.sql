ALTER TABLE payments ADD COLUMN payment_code VARCHAR(50);
ALTER TABLE payments ADD CONSTRAINT uk_payments_payment_code UNIQUE (payment_code);
ALTER TABLE payments MODIFY provider_transaction_id VARCHAR(190) NULL;
ALTER TABLE payments ADD CONSTRAINT uk_provider_transaction UNIQUE (provider_transaction_id);
ALTER TABLE payments ADD COLUMN expires_at DATETIME(6);

