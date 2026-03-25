-- Add/ensure indexes used by profile lookups.
-- Keep this as a new migration instead of editing V8 to avoid Flyway checksum drift.
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_indexes
                       WHERE schemaname = current_schema()
                         AND indexname = 'idx_user_profiles_user_id') THEN
            CREATE INDEX idx_user_profiles_user_id ON user_profiles (user_id);
        END IF;
    END
$$;

-- Supports existsByUsernameIgnoreCase lookups efficiently.
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_indexes
                       WHERE schemaname = current_schema()
                         AND indexname = 'idx_user_profiles_username_lower') THEN
            CREATE INDEX idx_user_profiles_username_lower ON user_profiles ((LOWER(username)));
        END IF;
    END
$$;


