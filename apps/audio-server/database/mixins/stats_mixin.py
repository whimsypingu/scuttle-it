import logging

logger = logging.getLogger(__name__)


class StatsMixin:
    """Handles database stats read and write operations"""

    async def increment_listened_durations(self, buffer: dict[str, float]):
        """Increment listened_duration fields for all track_id"""
        logger.info(f"Incrementing listened_duration statistics")

        cases = []          # "WHEN id = :id_0 THEN :dur_0"
        params = {}         # id_X dur_X mapping
        placeholders = []   # ":id_0", ":id_1", ":id_2", etc
        track_ids = []      # "abc", "def", "ghi", etc

        for i, (track_id, listened_duration) in enumerate(buffer.items()):
            rounded_duration = round(listened_duration)
            if rounded_duration <= 0:
                continue

            cases.append(f"WHEN id = :id_{i} THEN :dur_{i}")
            params[f"id_{i}"] = track_id
            params[f"dur_{i}"] = rounded_duration
            placeholders.append(f":id_{i}")
            track_ids.append(track_id)
        
        if not track_ids:
            return True

        cases_clause = " ".join(cases)
        placeholders_clause = ", ".join(placeholders) # ":id_0, :id_1, :id_2, ..."

        query = f"""
            UPDATE tracks
            SET listened_duration = listened_duration + CASE {cases_clause} ELSE 0 END
            WHERE id IN ({placeholders_clause});
        """

        try:
            async with self.session() as db:
                await db.execute(query, params)

                logger.info(f"Successfully incremented listened_duration statistics")
                return True
            
        except Exception:
            logger.exception("Failed to increment listened_durations")
            raise


    
    async def update_listened_ats(self, buffer: dict[str, int]):
        logger.info(f"Updating listened_at statistics")

        cases = []          # "WHEN id = :id_0 THEN :ts_0"
        params = {}         # id_X ts_X mapping
        placeholders = []   # ":id_0", ":id_1", etc
        track_ids = []      # "abc", "def", etc

        for i, (track_id, listened_at) in enumerate(buffer.items()):
            cases.append(f"WHEN id = :id_{i} THEN :ts_{i}")
            params[f"id_{i}"] = track_id
            params[f"ts_{i}"] = listened_at
            placeholders.append(f":id_{i}")
            track_ids.append(track_id)

        if not track_ids:
            return True
        
        cases_clause = " ".join(cases)
        placeholders_clause = ", ".join(placeholders) # ":id_0, :id_1, ..."

        query = f"""
            UPDATE tracks
            SET listened_at = MAX(COALESCE(listened_at, 0), CASE {cases_clause} ELSE 0 END)
            WHERE id in ({placeholders_clause});
        """

        try:
            async with self.session() as db:
                await db.execute(query, params)

                logger.info(f"Successfully updated listened_at statistics")
                return True
            
        except Exception:
            logger.exception("Failed to update listened_at statistics")


    async def get_stats(self) -> dict:
        """Get the stats for total downloads and listened duration"""

        query = """
            SELECT
                (SELECT COUNT(*) FROM downloads) AS total_track_count,
                (SELECT COALESCE(SUM(listened_duration), 0) FROM tracks) AS total_listened_duration;
        """

        try:
            async with self.session() as db:
                async with db.execute(query) as cursor:
                    row = await cursor.fetchone()

                    return dict(row)

        except Exception:
            logger.exception("Failed to retrieve stats")
            raise
