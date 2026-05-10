-- Flat table for fast reads
DROP TABLE IF EXISTS Tracks;

CREATE TABLE Tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    duration INTEGER, -- in seconds
    r2_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracks_artist ON Tracks(artist);
CREATE INDEX idx_tracks_album ON Tracks(album);
