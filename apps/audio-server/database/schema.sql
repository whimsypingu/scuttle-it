-- tracks table
CREATE TABLE IF NOT EXISTS tracks (
    internal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE,
    title TEXT NOT NULL,
    title_display TEXT,
    duration REAL DEFAULT 0.0,
    pref REAL DEFAULT 0.0 CHECK (pref >= 0.0 AND pref <= 1.0),
    pref_weight REAL DEFAULT 1.0
);


-- artists table
CREATE TABLE IF NOT EXISTS artists (
    internal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE,
    name TEXT NOT NULL, --name is highlighted as a keyword?
    name_display TEXT,
    pref REAL DEFAULT 0.0 CHECK (pref >= 0.0 AND pref <= 1.0),
    pref_weight REAL DEFAULT 1.0,
    enriched_at INTEGER DEFAULT 0 --see https://sqlite.org/lang_datefunc.html for (unixepoch())
);


-- track and artists junction table
CREATE TABLE IF NOT EXISTS track_artists (
    track_internal_id INTEGER,
    artist_internal_id INTEGER,
    FOREIGN KEY (track_internal_id) REFERENCES tracks(internal_id) ON DELETE CASCADE,
    FOREIGN KEY (artist_internal_id) REFERENCES artists(internal_id) ON DELETE CASCADE,
    PRIMARY KEY (track_internal_id, artist_internal_id)
);

-- fts5 view
CREATE VIEW IF NOT EXISTS track_artist_search_view AS
SELECT 
    t.internal_id as internal_id,
    t.title as title,
    GROUP_CONCAT(a.name, ' ') as names
FROM tracks t
JOIN track_artists ta ON t.internal_id = ta.track_internal_id
JOIN artists a ON ta.artist_internal_id = a.internal_id
GROUP BY t.internal_id;

-- fts5 table
CREATE VIRTUAL TABLE IF NOT EXISTS catalog_fts USING fts5(
    title, 
    names,
    content='track_artist_search_view',
    content_internal_id='internal_id',
    tokenize='unicode61 remove_diacritics 1' --see https://sqlite.org/fts5.html section 4.3.1
);

-- downloads table
CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    downloaded_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- likes table
CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    position REAL NOT NULL,
    liked_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (id) REFERENCES downloads(id) ON DELETE CASCADE
);

-- likes position index
CREATE INDEX IF NOT EXISTS idx_likes_position
ON likes(position);

-- playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);

-- playlist and titles junction table
CREATE TABLE IF NOT EXISTS playlist_titles (
    playlist_id INTEGER NOT NULL,
    title_id TEXT NOT NULL,
    position REAL NOT NULL,
    added_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (title_id) REFERENCES downloads(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, title_id)
);

-- playlist titles covering index
CREATE INDEX IF NOT EXISTS idx_playlist_titles_position
ON playlist_titles (playlist_id, position, title_id);