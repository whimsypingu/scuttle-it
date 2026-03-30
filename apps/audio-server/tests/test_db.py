import pytest

@pytest.mark.asyncio
async def test_register_track(db, sample_track):
    #not registered
    q1 = await db.is_track_registered(sample_track.id)
    assert q1 is False

    #register
    q2 = await db.register_track(sample_track)
    assert q2 is True

    #is registered
    q3 = await db.is_track_registered(sample_track.id)
    assert q3 is True

    #unregister
    q4 = await db.unregister_track(sample_track.id)
    assert q4 is True

    #not registered
    q5 = await db.is_track_registered(sample_track.id)
    assert q5 is False


@pytest.mark.asyncio
async def test_register_duplicate_track(db, sample_track):
    #register once
    q1 = await db.register_track(sample_track)
    assert q1 is True

    #try re-register
    q2 = await db.register_track(sample_track)
    assert q2 is False