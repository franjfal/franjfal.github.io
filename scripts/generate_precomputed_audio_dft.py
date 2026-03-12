#!/usr/bin/env python3
import json
import math
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_DIR = ROOT / "assets" / "wav-samples"
OUTPUT_DIR = ROOT / "assets" / "MatExp" / "analisis" / "hilbert" / "audio-conversion" / "precomputed"
TARGET_SECONDS = 2
RECONSTRUCTION_LEVELS = [500, 1000, 1500, 2000, 3000, 5000, 10000, 20000]


def slug_to_label(name: str) -> str:
    return re.sub(r"\s+", " ", name.replace("-", " ")).strip().title()


def convert_to_wav(input_path: Path, output_path: Path) -> None:
    subprocess.run(
        ["/usr/bin/afconvert", "-f", "WAVE", "-d", "LEI16", str(input_path), str(output_path)],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def load_first_channel_float32(audio_path: Path):
    with tempfile.TemporaryDirectory() as tmp_dir:
        wav_path = Path(tmp_dir) / f"{audio_path.stem}.wav"
        convert_to_wav(audio_path, wav_path)
        with wave.open(str(wav_path), "rb") as wav_file:
            num_channels = wav_file.getnchannels()
            sample_rate = wav_file.getframerate()
            frame_count = wav_file.getnframes()
            raw_frames = wav_file.readframes(frame_count)

    samples = np.frombuffer(raw_frames, dtype="<i2")
    if num_channels > 1:
        samples = samples.reshape(-1, num_channels)[:, 0]
    samples = samples.astype(np.float32) / 32768.0
    return samples, sample_rate, frame_count / sample_rate


def save_float32(path: Path, array: np.ndarray) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    np.asarray(array, dtype=np.float32).tofile(path)
    return "/" + str(path.relative_to(ROOT)).replace("\\", "/")


def save_complex_interleaved(path: Path, array: np.ndarray) -> str:
    interleaved = np.empty(array.size * 2, dtype=np.float32)
    interleaved[0::2] = array.real.astype(np.float32)
    interleaved[1::2] = array.imag.astype(np.float32)
    path.parent.mkdir(parents=True, exist_ok=True)
    interleaved.tofile(path)
    return "/" + str(path.relative_to(ROOT)).replace("\\", "/")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {
        "targetSeconds": TARGET_SECONDS,
        "reconstructionLevels": RECONSTRUCTION_LEVELS,
        "audios": [],
    }

    for audio_path in sorted(SAMPLES_DIR.glob("*.mp3")):
        print(f"Procesando {audio_path.name}...")
        samples, sample_rate, original_duration = load_first_channel_float32(audio_path)
        max_samples = min(len(samples), int(sample_rate * TARGET_SECONDS))
        processed_samples = np.array(samples[:max_samples], dtype=np.float32, copy=True)
        processed_duration = len(processed_samples) / sample_rate if sample_rate else 0
        was_trimmed = len(samples) > len(processed_samples)

        n = int(len(processed_samples))
        k = n // 2
        if k <= 0:
            print(f"  Omitido {audio_path.name}: muy pocas muestras.")
            continue

        spectrum = np.fft.fft(processed_samples.astype(np.float64))[:k]

        audio_id = audio_path.stem
        audio_entry = {
            "id": audio_id,
            "label": slug_to_label(audio_id),
            "audioUrl": "/assets/wav-samples/" + audio_path.name,
            "sampleRate": sample_rate,
            "originalDuration": round(float(original_duration), 6),
            "processedDuration": round(float(processed_duration), 6),
            "processedSampleCount": int(n),
            "dftCoefficientCount": int(k),
            "wasTrimmed": was_trimmed,
            "files": {
                "audioValues": save_float32(OUTPUT_DIR / f"{audio_id}-audio.f32", processed_samples),
                "dftCoefficients": save_complex_interleaved(OUTPUT_DIR / f"{audio_id}-dft.f32", spectrum),
                "reconstructions": {},
            },
        }

        for keep in RECONSTRUCTION_LEVELS:
            keep_count = min(keep, k)
            truncated = np.zeros(k + 1, dtype=np.complex128)
            truncated[:keep_count] = spectrum[:keep_count]
            reconstructed = np.fft.irfft(truncated, n=2 * k).astype(np.float32)
            audio_entry["files"]["reconstructions"][str(keep)] = save_float32(
                OUTPUT_DIR / f"{audio_id}-recon-{keep}.f32",
                reconstructed,
            )

        manifest["audios"].append(audio_entry)

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Manifest generado en {manifest_path}")


if __name__ == "__main__":
    main()
