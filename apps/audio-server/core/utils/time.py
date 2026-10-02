import time

def current_timestamp():
    """Matches sqlite 3.38.0+ unixepoch() definition"""
    return int(time.time())