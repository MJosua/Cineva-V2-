"""Retrieve public model weights only; never uploads user media."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import hashlib
import shutil
import requests

cache = Path.home() / '.cache/tooling/cineva-whisper-small'
cache.mkdir(parents=True, exist_ok=True)
snapshots = Path.home() / '.cache/huggingface/hub/models--Systran--faster-whisper-small/snapshots'
for source in next(snapshots.iterdir()).iterdir():
    if source.name != 'model.bin':
        shutil.copyfile(source, cache / source.name)
size = 483546902
chunk = 8 * 1024 * 1024
def fetch(start):
    end = min(start + chunk, size) - 1
    target = cache / f'part-{start}'
    if target.exists() and target.stat().st_size == end - start + 1:
        return target
    for attempt in range(3):
        try:
            url = f'https://huggingface.co/Systran/faster-whisper-small/resolve/main/model.bin?chunk={start}'
            response = requests.get(url, headers={'Range': f'bytes={start}-{end}'}, timeout=90)
            response.raise_for_status()
            if response.status_code != 206 or len(response.content) != end - start + 1:
                raise ValueError('Unexpected model range response')
            target.write_bytes(response.content)
            return target
        except Exception:
            if attempt == 2:
                raise
starts = list(range(0, size, chunk))
with ThreadPoolExecutor(max_workers=8) as executor:
    futures = [executor.submit(fetch, start) for start in starts]
    for index, future in enumerate(as_completed(futures), 1):
        future.result()
        print(f'Model chunks {index}/{len(starts)}', flush=True)
target = cache / 'model.bin'
with target.open('wb') as output:
    for start in starts:
        output.write((cache / f'part-{start}').read_bytes())
digest = hashlib.sha256(target.read_bytes()).hexdigest()
assert digest == '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671', digest
print(f'Public model ready and SHA256 verified: {target}', flush=True)
