ALTER TABLE user_subscriptions DROP CHECK chk_user_subscriptions_status;
ALTER TABLE user_subscriptions ADD CONSTRAINT chk_user_subscriptions_status 
  CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'PENDING'));
