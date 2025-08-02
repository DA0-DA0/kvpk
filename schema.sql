-- Items
DROP TABLE IF EXISTS items;

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileUuid TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_profileUuid_key UNIQUE (profileUuid, key)
);

CREATE INDEX IF NOT EXISTS idx_items_profileUuid ON items(profileUuid);
CREATE INDEX IF NOT EXISTS idx_items_key ON items(key);
