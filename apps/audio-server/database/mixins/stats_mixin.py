import logging

logger = logging.getLogger(__name__)


class StatsMixin:
    """Handles database stats read and write operations"""

    async def increment_listen_durations(self, buffer: dict[str, float]):
        """Increment listen_duration fields for all track_id"""
        logger.info(f"Incrementing listen_duration statistics")

        values = []
        params = {}

        for i, (track_id, listen_duration) in enumerate(buffer.items()):
            values.append(f"(:id_{i}, :dur_{i})")
            params[f"id_{i}"] = track_id
            params[f"dur_{i}"] = round(listen_duration) #cast to int

        values_clause = ", ".join(values)

        query = f"""
            UPDATE tracks AS t
            SET listen_duration = t.listen_duration + buffer.duration
            FROM (VALUES {values_clause}) AS buffer(track_id, duration)
            WHERE t.track_id = buffer.track_id;
        """

        try:
            async with self.session() as db:
                await db.execute(query, params)

                logger.info(f"Successfully incremented listen_duration statistics")
                return True
            
        except Exception:
            logger.exception("Failed to increment listen_durations")
            raise
