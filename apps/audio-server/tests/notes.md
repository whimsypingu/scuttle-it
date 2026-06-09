For this test package to work, must separately do some steps because the necessary stuff won't be installed via the requirements.txt file:

```bash
pip install pytest pytest-asyncio
```

To run all tests:
```bash
python -m pytest apps/audio-server
```

For specific files:
```bash
python -m pytest apps/audio-server/tests/TEST_FILE_NAME.py
```

Files that start with `test_` are marked for testing via pytest. Other files that start with `benchmark_` are meant for identifying weaknesses and diagnosing them.