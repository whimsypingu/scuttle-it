import logging

logger = logging.getLogger(__name__)


class StatsMixin:
    """Handles database stats read and write operations"""

    async def increment_listen_durations(self, buffer: dict[str, float]):
        """Increment listen_duration fields for all track_id"""
        logger.info(f"Incrementing listen_duration statistics")

        cases = []          # "WHEN id = :id_0 THEN :dur_0"
        params = {}         # id_X dur_X mapping
        placeholders = []   # ":id_0", ":id_1", ":id_2", etc
        track_ids = []      # "abc", "def", "ghi", etc

        for i, (track_id, listen_duration) in enumerate(buffer.items()):
            rounded_duration = round(listen_duration)
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

                logger.info(f"Successfully incremented listen_duration statistics")
                return True
            
        except Exception:
            logger.exception("Failed to increment listen_durations")
            raise
