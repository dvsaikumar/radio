DROP TABLE IF EXISTS Tracks;
DROP TABLE IF EXISTS Playlists;

-- Playlists table
CREATE TABLE IF NOT EXISTS Playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated Tracks table with playlist relation
CREATE TABLE IF NOT EXISTS Tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    duration INTEGER,
    r2_key TEXT NOT NULL,
    playlist_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES Playlists(id)
);

CREATE INDEX IF NOT EXISTS idx_tracks_artist ON Tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON Tracks(album);
CREATE INDEX IF NOT EXISTS idx_tracks_playlist ON Tracks(playlist_id);
