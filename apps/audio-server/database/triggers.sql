-- triggers for re-calculating normalized preferences

-- tracks insertion trigger
CREATE TRIGGER IF NOT EXISTS trg_pref_insert_tracks
AFTER INSERT ON tracks
BEGIN
    UPDATE tracks
    SET pref_weight = LN_BOOST(NEW.pref)
    WHERE internal_id = NEW.internal_id;
END;

-- tracks update trigger
CREATE TRIGGER IF NOT EXISTS trg_pref_update_tracks
AFTER UPDATE OF pref ON tracks
BEGIN
    UPDATE tracks
    SET pref_weight = LN_BOOST(NEW.pref)
    WHERE internal_id = NEW.internal_id;
END;


-- artists insertion trigger
CREATE TRIGGER IF NOT EXISTS trg_pref_insert_artist
AFTER INSERT ON artists
BEGIN
    UPDATE artists
    SET pref_weight = LN_BOOST(NEW.pref)
    WHERE internal_id = NEW.internal_id;
END;

-- artists update trigger
CREATE TRIGGER IF NOT EXISTS trg_pref_update_artists
AFTER UPDATE OF pref ON artists
BEGIN
    UPDATE artists
    SET pref_weight = LN_BOOST(NEW.pref)
    WHERE internal_id = NEW.internal_id;
END;
