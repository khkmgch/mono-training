CREATE TABLE app.users (
    id          UUID            PRIMARY KEY,
    login_id    VARCHAR(64)     NOT NULL,
    full_name   VARCHAR(100)    NOT NULL,
    version     INTEGER         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMPTZ     NULL     DEFAULT NULL,
    CONSTRAINT  uq_users_login_id UNIQUE (login_id)
);
