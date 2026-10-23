"""Preserve user reference assets and inspect sampled video frames; no app/DB changes."""
import cv2
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[3]
dest = root / '4. Refrence/visual/creator_dashboard_2026_10_18'
report = root / '3.Knowledge/reports/visual_reference_2026_10_18'
dest.mkdir(parents=True, exist_ok=True)
report.mkdir(parents=True, exist_ok=True)
sources = {
    'dashboard_reference.png': Path('C:/Users/test/AppData/Local/Temp/codex-clipboard-47c48d1c-b8f1-4573-a4c5-e66a4c0f214f.png'),
    'workflow_reference.mp4': Path('C:/Users/test/Downloads/WhatsApp Video 2026-10-13 at 10.01.01 PM.mp4'),
}
manifest = {'date': '2026-10-18', 'scope': 'Layout/interaction reference only; preserve current HOTS Cineva CSS/style', 'assets': []}
style_paths = ['1.Frontend/HOTS/src/index.css', '1.Frontend/HOTS/src/App.css', '1.Frontend/HOTS/tailwind.config.ts', '1.Frontend/HOTS/src/components/layout/AppLayout.tsx', '1.Frontend/packages/ui-kit/tailwind-preset.cjs']
style_hashes = {p: hashlib.sha256((root/p).read_bytes()).hexdigest() for p in style_paths}
baseline = report/'style_baseline.json'
if baseline.exists() and json.loads(baseline.read_text(encoding='utf8')) != style_hashes:
    raise RuntimeError('Existing style baseline differs; review source changes before continuing')
baseline.write_text(json.dumps(style_hashes, indent=2), encoding='utf8')
for name, source in sources.items():
    data = source.read_bytes()
    target = dest / name
    if target.exists() and target.read_bytes() != data:
        raise RuntimeError(f'Refusing to overwrite a different asset: {target}')
    if not target.exists():
        shutil.copy2(source, target)
    digest = hashlib.sha256(data).hexdigest()
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
    manifest['assets'].append({'original': str(source), 'local': str(target.relative_to(root)), 'bytes': len(data), 'sha256': digest})
cap = cv2.VideoCapture(str(dest / 'workflow_reference.mp4'))
if not cap.isOpened():
    raise RuntimeError('Cannot decode reference video')
fps = cap.get(cv2.CAP_PROP_FPS)
frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = frames / fps
manifest['video'] = {'fps': fps, 'frames': frames, 'duration_seconds': duration, 'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), 'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}
sheet = Image.new('RGB', (1080, 3*560), '#eeeeee')
timestamps = [max(0, duration-0.25)*i/8 for i in range(9)]
for index, seconds in enumerate(timestamps):
    cap.set(cv2.CAP_PROP_POS_MSEC, seconds*1000)
    ok, frame = cap.read()
    if not ok:
        raise RuntimeError(f'Cannot read video at {seconds}s')
    im = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    im.thumbnail((350, 525))
    x, y = (index % 3)*360, (index//3)*560
    sheet.paste(im, (x+(360-im.width)//2, y+25))
    ImageDraw.Draw(sheet).text((x+10, y+5), f'{seconds:.1f}s', fill='#111111')
cap.release()
sheet.save(report/'video_contact_sheet.jpg', quality=90)
manifest['sample_timestamps_seconds'] = timestamps
(dest/'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf8')
print(json.dumps(manifest['video']))
