# SimCLR views: crop, flip, brightness/contrast. Numpy only.

from __future__ import annotations

import numpy as np

from . import const


def _resize_nn(img: np.ndarray, size: int) -> np.ndarray:
    h, w = img.shape[:2]
    y = (np.arange(size) * h / size).astype(int)
    x = (np.arange(size) * w / size).astype(int)
    return img[y[:, None], x]


def one_view(img: np.ndarray, rng: np.random.Generator, size: int = const.IMG_SIZE) -> np.ndarray:
    h, w = img.shape[:2]
    scale = float(rng.uniform(0.75, 1.0))
    ch, cw = max(int(h * scale), 8), max(int(w * scale), 8)
    y0 = int(rng.integers(0, h - ch + 1))
    x0 = int(rng.integers(0, w - cw + 1))
    crop = img[y0 : y0 + ch, x0 : x0 + cw]
    out = _resize_nn(crop, size).astype(np.float32)
    if rng.random() < 0.5:
        out = out[:, ::-1]
    if rng.random() < 0.2:
        out = 255.0 - out
    bright = float(rng.uniform(0.6, 1.4))
    contrast = float(rng.uniform(0.6, 1.4))
    mean = out.mean()
    out = (out - mean) * contrast + mean
    out = out * bright
    if rng.random() < 0.2:
        g = out.mean(axis=2, keepdims=True)
        out = np.repeat(g, 3, axis=2)
    return np.clip(out, 0, 255)


def pretext_view(img: np.ndarray, rng: np.random.Generator, size: int = const.IMG_SIZE) -> np.ndarray:
    """Light jitter for rotation pretext. No flip or invert: those fight the rotation label."""
    h, w = img.shape[:2]
    scale = float(rng.uniform(0.85, 1.0))
    ch, cw = max(int(h * scale), 8), max(int(w * scale), 8)
    y0 = int(rng.integers(0, h - ch + 1))
    x0 = int(rng.integers(0, w - cw + 1))
    out = _resize_nn(img[y0 : y0 + ch, x0 : x0 + cw], size).astype(np.float32)
    out = out * float(rng.uniform(0.8, 1.2))
    return np.clip(out, 0, 255)


def to_chw(img: np.ndarray) -> np.ndarray:
    x = img.astype(np.float32) / 255.0
    return np.transpose(x, (2, 0, 1))
