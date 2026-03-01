CREATE TABLE user_auth_providers
(
    id          UUID                     NOT NULL,
    user_id     UUID                     NOT NULL,
    provider    VARCHAR(20)              NOT NULL,
    provider_id VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT user_auth_providers_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user_auth_provider_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT chk_user_auth_provider_provider CHECK (provider IN ('LOCAL', 'GOOGLE')),
    CONSTRAINT uk_user_auth_provider_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_auth_provider_provider ON user_auth_providers (provider);
CREATE INDEX idx_user_auth_provider_provider_id ON user_auth_providers (provider_id);
CREATE UNIQUE INDEX uk_user_auth_provider_provider_provider_id
    ON user_auth_providers (provider, provider_id)
    WHERE provider_id IS NOT NULL;

INSERT INTO user_auth_providers (id, user_id, provider, provider_id, created_at, updated_at)
SELECT gen_random_uuid(), id, provider, provider_id, NOW(), NOW()
FROM users;

ALTER TABLE users DROP COLUMN provider_id;
ALTER TABLE users DROP COLUMN provider;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_status_check;
UPDATE users SET status = 'ACTIVE' WHERE status IN ('CREATED', 'VERIFIED');
UPDATE users SET status = 'DELETED' WHERE status = 'NOT_EXIST';
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'LOCKED', 'DELETED'));
