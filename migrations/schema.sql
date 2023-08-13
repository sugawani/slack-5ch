DROP TABLE IF EXISTS post_messages;
CREATE TABLE IF NOT EXISTS post_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    res_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT
)
;