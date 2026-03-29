For this test package to work, must separately do some steps because the necessary stuff won't be installed via the requirements.txt file:

```bash
pip install pytest pytest-asyncio
```

```bash
python -m pytest apps/audio-server
```