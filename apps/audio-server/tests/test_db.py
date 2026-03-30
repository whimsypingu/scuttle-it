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

    #duplicate register
    q4 = await db.register_track(sample_track)
    assert q4 is False

    #unregister
    q5 = await db.unregister_track(sample_track.id)
    assert q5 is True

    #not registered
    q6 = await db.is_track_registered(sample_track.id)
    assert q6 is False


@pytest.mark.asyncio
async def test_register_download(db, sample_track):
    #not registered
    q1 = await db.is_track_registered(sample_track.id)
    assert q1 is False

    #not downloaded
    q2 = await db.is_track_downloaded(sample_track.id)
    assert q2 is False

    #attempt download without prior register
    q3 = await db.register_download(sample_track.id)
    assert q3 is False

    #not downloaded
    q4 = await db.is_track_downloaded(sample_track.id)
    assert q4 is False

    #register and download
    q5 = await db.register_track(sample_track)
    q6 = await db.register_download(sample_track.id)
    assert q6 is True

    #is downloaded
    q7 = await db.is_track_downloaded(sample_track.id)
    assert q7 is True

    #unregister download
    q8 = await db.unregister_download(sample_track.id)
    assert q8 is True

    #is registered
    q9 = await db.is_track_registered(sample_track.id)
    assert q9 is True

    #not downloaded
    q10 = await db.is_track_downloaded(sample_track.id)
    assert q10 is False