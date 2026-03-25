CREATE TABLE IF NOT EXISTS user_profiles
(
    id           UUID                     NOT NULL,
    user_id      UUID                     NOT NULL,
    display_name VARCHAR(100),
    avatar_url   VARCHAR(500),
    bio          VARCHAR(1000),
    username     VARCHAR(50),
    deleted      BOOLEAN DEFAULT FALSE    NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    version      BIGINT,
    created_by   VARCHAR(255)             NOT NULL,
    updated_by   VARCHAR(255)             NOT NULL,
    CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uk_user_profiles_user_id UNIQUE (user_id),
    CONSTRAINT uk_user_profiles_username UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);


