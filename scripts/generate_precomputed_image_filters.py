#!/usr/bin/env python3
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_DIR = ROOT / "assets" / "image-samples"
OUTPUT_DIR = ROOT / "assets" / "MatExp" / "analisis" / "hilbert" / "image-filter" / "precomputed"
MAX_SIZE = 250
CUTOFF_PRESETS = [10, 20, 30, 40, 50, 60, 70, 80, 90]
FILTER_TYPES = ["lowpass", "highpass", "bandpass"]


def slug_to_label(name: str) -> str:
    return re.sub(r"\s+", " ", name.replace("-", " ")).strip().title()


def resize_dimensions(width: int, height: int, max_size: int):
    if width <= max_size and height <= max_size:
        return width, height
    scale = min(max_size / width, max_size / height)
    return max(1, round(width * scale)), max(1, round(height * scale))


def load_processed_grayscale(image_path: Path):
    with Image.open(image_path) as img:
        img = img.convert("RGB")
        original_width, original_height = img.size
        new_width, new_height = resize_dimensions(original_width, original_height, MAX_SIZE)
        if (new_width, new_height) != img.size:
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        rgb = np.asarray(img, dtype=np.float32)

    gray = np.clip(np.rint(0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]), 0, 255).astype(np.uint8)
    return {
        "gray": gray,
        "original_width": original_width,
        "original_height": original_height,
        "processed_width": gray.shape[1],
        "processed_height": gray.shape[0],
        "was_resized": (new_width, new_height) != (original_width, original_height),
    }


def spectrum_visualization_from_dft(dft: np.ndarray) -> np.ndarray:
    shifted = np.fft.fftshift(dft)
    log_mag = np.log1p(np.abs(shifted))
    max_val = float(log_mag.max()) if log_mag.size else 0.0
    if max_val <= 1e-12:
        return np.zeros(log_mag.shape, dtype=np.uint8)
    return np.clip(np.rint((255.0 * log_mag) / max_val), 0, 255).astype(np.uint8)


def apply_filter(dft: np.ndarray, filter_type: str, cutoff_percent: int) -> np.ndarray:
    height, width = dft.shape
    shifted = np.fft.fftshift(dft)
    center_y = height // 2
    center_x = width // 2
    max_dist = float(np.sqrt(center_y * center_y + center_x * center_x))
    cutoff_dist = (cutoff_percent / 100.0) * max_dist

    y_indices, x_indices = np.indices((height, width))
    distances = np.sqrt((y_indices - center_y) ** 2 + (x_indices - center_x) ** 2)

    if filter_type == "lowpass":
        mask = distances <= cutoff_dist
    elif filter_type == "highpass":
        mask = distances >= cutoff_dist
    elif filter_type == "bandpass":
        band_width = 0.15 * max_dist
        lower_bound = cutoff_dist - (band_width / 2.0)
        upper_bound = cutoff_dist + (band_width / 2.0)
        mask = (distances >= lower_bound) & (distances <= upper_bound)
    else:
        mask = np.ones((height, width), dtype=bool)

    filtered_shifted = shifted * mask
    return np.fft.ifftshift(filtered_shifted)


def reconstruct_filtered_image(filtered_dft: np.ndarray) -> np.ndarray:
    reconstructed = np.fft.ifft2(filtered_dft).real
    min_val = float(reconstructed.min()) if reconstructed.size else 0.0
    max_val = float(reconstructed.max()) if reconstructed.size else 0.0
    value_range = max_val - min_val
    if value_range <= 1e-6:
        normalized = np.full(reconstructed.shape, np.clip(np.rint(min_val), 0, 255), dtype=np.uint8)
    else:
        normalized = np.clip(np.rint(255.0 * (reconstructed - min_val) / value_range), 0, 255).astype(np.uint8)
    return normalized


def save_uint8(path: Path, array: np.ndarray) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    array.astype(np.uint8).tofile(path)
    return "/" + path.relative_to(ROOT).as_posix()


def save_float32(path: Path, array: np.ndarray) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    array.astype(np.float32).tofile(path)
    return "/" + path.relative_to(ROOT).as_posix()


def save_png(path: Path, array: np.ndarray) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(array.astype(np.uint8)).save(path)
    return "/" + path.relative_to(ROOT).as_posix()


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = {
        "maxSize": MAX_SIZE,
        "cutoffPresets": CUTOFF_PRESETS,
        "filterTypes": FILTER_TYPES,
        "images": [],
    }

    for image_path in sorted(SAMPLES_DIR.glob("*")):
        if image_path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue

        print(f"Procesando {image_path.name}...")
        image_id = image_path.stem
        processed = load_processed_grayscale(image_path)
        gray = processed["gray"]
        gray_float = gray.astype(np.float32)
        dft = np.fft.fft2(gray_float)
        dft_magnitude = np.abs(dft).astype(np.float32)
        original_spectrum = spectrum_visualization_from_dft(dft)

        image_entry = {
            "id": image_id,
            "label": slug_to_label(image_id),
            "sourceUrl": "/" + image_path.relative_to(ROOT).as_posix(),
            "originalWidth": processed["original_width"],
            "originalHeight": processed["original_height"],
            "processedWidth": processed["processed_width"],
            "processedHeight": processed["processed_height"],
            "wasResized": processed["was_resized"],
            "files": {
                "grayscalePixels": save_uint8(OUTPUT_DIR / f"{image_id}-gray.u8", gray),
                "originalSpectrum": save_png(OUTPUT_DIR / f"{image_id}-spectrum.png", original_spectrum),
                "dftMagnitude": save_float32(OUTPUT_DIR / f"{image_id}-dft-magnitude.f32", dft_magnitude),
                "filtered": {},
            },
        }

        for filter_type in FILTER_TYPES:
            image_entry["files"]["filtered"][filter_type] = {}
            for cutoff_percent in CUTOFF_PRESETS:
                filtered_dft = apply_filter(dft, filter_type, cutoff_percent)
                filtered_pixels = reconstruct_filtered_image(filtered_dft)
                filtered_spectrum = spectrum_visualization_from_dft(filtered_dft)
                image_entry["files"]["filtered"][filter_type][str(cutoff_percent)] = {
                    "pixels": save_uint8(OUTPUT_DIR / f"{image_id}-{filter_type}-{cutoff_percent}-pixels.u8", filtered_pixels),
                    "spectrum": save_png(OUTPUT_DIR / f"{image_id}-{filter_type}-{cutoff_percent}-spectrum.png", filtered_spectrum),
                }

        manifest["images"].append(image_entry)

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Manifest generado en {manifest_path}")


if __name__ == "__main__":
    main()
