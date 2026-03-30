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
    content_rowid='internal_id',
    tokenize='unicode61 remove_diacritics 1' --see https://sqlite.org/fts5.html section 4.3.1
);