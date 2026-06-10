CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    original_url TEXT NOT NULL,
    short_code VARCHAR(20) NOT NULL UNIQUE,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE click_events (
    id SERIAL PRIMARY KEY,
    url_id INTEGER NOT NULL,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_url
        FOREIGN KEY(url_id)
        REFERENCES urls(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_urls_shortcode
ON urls(short_code);

CREATE INDEX idx_urls_user_id
ON urls(user_id);

CREATE INDEX idx_click_events_url_id
ON click_events(url_id);