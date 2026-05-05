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


-- downloads table
CREATE TABLE IF NOT EXISTS downloads (
    track_internal_id INTEGER PRIMARY KEY,
    downloaded_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (track_internal_id) REFERENCES tracks(internal_id) ON DELETE CASCADE
);

-- likes table
CREATE TABLE IF NOT EXISTS likes (
    track_internal_id INTEGER PRIMARY KEY,
    position REAL NOT NULL UNIQUE,
    liked_at INTEGER DEFAULT (unixepoch()), --consider renaming to added_at for consistency
    FOREIGN KEY (track_internal_id) REFERENCES tracks(internal_id) ON DELETE CASCADE
);

-- likes position index
CREATE INDEX IF NOT EXISTS idx_likes_position
ON likes(position);


-- playlists table
CREATE TABLE IF NOT EXISTS playlists (
    internal_id INTEGER PRIMARY KEY,
    id TEXT UNIQUE,
    name TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    description TEXT
);

-- playlist and titles junction table
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_internal_id INTEGER NOT NULL,
    track_internal_id TEXT NOT NULL,
    position REAL NOT NULL,
    added_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (playlist_internal_id) REFERENCES playlists(internal_id) ON DELETE CASCADE,
    FOREIGN KEY (track_internal_id) REFERENCES tracks(internal_id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_internal_id, track_internal_id)
);

-- playlist titles covering index
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position
ON playlist_tracks (playlist_internal_id, position, track_internal_id);


-- play queue
CREATE TABLE IF NOT EXISTS play_queue (
    queue_id INTEGER PRIMARY KEY, --used for state management
    track_internal_id TEXT NOT NULL,
    position REAL NOT NULL UNIQUE,
    added_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (track_internal_id) REFERENCES tracks(internal_id) ON DELETE CASCADE
);

-- play queue position index
CREATE INDEX IF NOT EXISTS idx_play_queue_position
ON play_queue(position);

-- settings
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), --ensures only one row
    loopmode INTEGER DEFAULT 1 --loop modes: 0=None, 1=All, 2=One 
);

INSERT OR IGNORE INTO settings (id) VALUES (1); --initialize settings