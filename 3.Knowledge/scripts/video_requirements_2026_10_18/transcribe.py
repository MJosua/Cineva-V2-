"""Local-only speech recognition of the user-provided Cineva reference."""
import hashlib
import json
import math
import argparse
from pathlib import Path
import av
import numpy as np
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
from faster_whisper.vad import get_speech_timestamps

ROOT = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--source', default=str(ROOT / '4. Refrence/visual/creator_dashboard_2026_10_18/workflow_reference.mp4'))
parser.add_argument('--out', default=str(ROOT / '3.Knowledge/reports/video_requirements_2026_10_18'))
parser.add_argument('--model', default='small')
args = parser.parse_args()
SOURCE = Path(args.source)
OUT = Path(args.out)
OUT.mkdir(parents=True, exist_ok=True)

with av.open(str(SOURCE)) as container:
    samples = np.concatenate([frame.to_ndarray() for frame in container.decode(audio=0)], axis=-1)
peak = float(np.max(np.abs(samples)))
rms = float(np.sqrt(np.mean(samples * samples)))
audio = decode_audio(str(SOURCE))
speech = get_speech_timestamps(audio)
assessment = dict(source=str(SOURCE), sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                  duration_seconds=len(audio) / 16000, decoded_float_peak=peak,
                  decoded_float_rms=rms, peak_dbfs=20 * math.log10(peak) if peak else None,
                  pcm16_peak=float(np.max(np.abs(audio))), vad_speech_segments=speech,
                  scope='Local audio assessment only; no application or database changes')
(OUT / 'audio_assessment.json').write_text(json.dumps(assessment, indent=2), encoding='utf-8')
if peak < 1 / 32768 and not speech:
    (OUT / 'transcript.txt').write_text(
        '[00:00–01:21.245] Tidak ada ucapan yang dapat ditranskripsikan. '
        'Audio berada di bawah satu langkah PCM 16-bit dan VAD tidak mendeteksi ucapan. '
        'Ini bukan transkrip narasi dan tidak boleh dijadikan sumber requirement lisan.\n', encoding='utf-8')
    print(json.dumps(assessment), flush=True)
    raise SystemExit(0)

print('Loading multilingual Whisper small, CPU int8. Audio stays local.', flush=True)
model = WhisperModel(args.model, device='cpu', compute_type='int8', cpu_threads=6)
segments, info = model.transcribe(str(SOURCE), language='id', beam_size=5,
                                  vad_filter=True, condition_on_previous_text=False)
records = []
for s in segments:
    item = dict(start=s.start, end=s.end, text=s.text.strip(),
                avg_logprob=s.avg_logprob, no_speech_prob=s.no_speech_prob)
    records.append(item)
    print(f'[{s.start:.2f}-{s.end:.2f}] {s.text}', flush=True)
result = dict(source=str(SOURCE), sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              model='Systran/faster-whisper-small', device='cpu', compute_type='int8',
              language=info.language, language_probability=info.language_probability,
              language_forced='id', duration=info.duration, segments=records,
              warning='Automatic transcript. Review uncertain words; forced language is not language detection proof.')
(OUT / 'transcript.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
(OUT / 'transcript.txt').write_text('\n'.join(
    f'[{s["start"]:06.2f}–{s["end"]:06.2f}] {s["text"]}' for s in records), encoding='utf-8')
print(f'Transcript saved: {len(records)} segments.', flush=True)
