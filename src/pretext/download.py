# Try LILA Snapshot Serengeti; on block or size, write a capped multi-site analog.

from __future__ import annotations

import urllib.request
from pathlib import Path

import numpy as np

from . import const


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def bundle_path() -> Path:
    return repo_root() / const.DATA_NPZ


def try_lila(timeout: float = 5.0) -> str | None:
    """Return a blocker string. Never pulls the full image corpus."""
    try:
        urllib.request.urlopen(const.LILA_PAGE, timeout=timeout)
    except Exception as e:
        return f"LILA Snapshot Serengeti unavailable ({e})"
    return (
        "LILA Snapshot Serengeti page reachable but corpus is tens of GB; "
        "capped synthetic multi-site analog used instead"
    )


def _stamp_shape(img: np.ndarray, kind: int, cy: int, cx: int, scale: int, color: np.ndarray):
    """Oriented silhouettes (not 4-fold symmetric) so rotation pretext has a signal."""
    h, w = img.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    s = max(scale, 4)
    if kind == 0:  # gazelle: horizontal ellipse
        mask = ((yy - cy) / max(s * 0.55, 1)) ** 2 + ((xx - cx) / max(s * 1.05, 1)) ** 2 <= 1
    elif kind == 1:  # zebra: triangle pointing up
        width = np.maximum((s - (cy - yy)) * 0.85, 1)
        mask = (yy <= cy + s) & (yy >= cy - s) & (np.abs(xx - cx) <= width)
    else:  # wildebeest: L-shape
        thick = max(int(s * 0.40), 2)
        span = int(s * 0.95)
        mask = ((yy >= cy) & (yy <= cy + span) & (np.abs(xx - cx + span // 2) <= thick)) | (
            (np.abs(yy - cy) <= thick) & (xx >= cx - span) & (xx <= cx)
        )
    img[mask] = color


def generate_bundle(
    classes=const.TOP_K,
    sites=const.SITES,
    per=const.MAX_PER_CLASS_PER_SITE,
    size=const.IMG_SIZE,
    seed=const.SEED,
) -> dict:
    """Multi-site traps: class = shape, site = color cast + texture.

    Shape is the only thing that should survive a new camera. Site identity is a
    strong color cast over the whole frame, plus grain, so a model that latches
    onto camera look will fail the hold-out.
    """
    rng = np.random.default_rng(seed)
    # Strong site look on the ground; only a mild white-balance on the animal so
    # the silhouette stays readable the way a real trap still shows a body.
    ground = {
        sites[0]: np.array([190.0, 140.0, 40.0]),
        sites[1]: np.array([40.0, 130.0, 55.0]),
        sites[2]: np.array([55.0, 50.0, 140.0]),
        sites[3]: np.array([150.0, 85.0, 35.0]),
        sites[4]: np.array([35.0, 55.0, 165.0]),
    }
    tint = {
        sites[0]: np.array([1.05, 0.95, 0.80]),
        sites[1]: np.array([0.88, 1.05, 0.90]),
        sites[2]: np.array([0.90, 0.90, 1.08]),
        sites[3]: np.array([1.08, 0.92, 0.82]),
        sites[4]: np.array([0.82, 0.92, 1.10]),
    }
    animal = np.array([230.0, 225.0, 210.0])
    images, y, site = [], [], []
    for s in sites:
        for k, _name in enumerate(classes):
            for _ in range(per):
                img = np.zeros((size, size, 3), dtype=np.float32)
                grain = rng.normal(0, 12, (size, size, 1))
                yy, xx = np.ogrid[:size, :size]
                # camera-specific mottle; not a class cue
                phase = sum(ord(c) for c in s) % 7
                mottle = 18 * np.sin((xx + phase * 3) / 4.0) * np.cos((yy + phase) / 5.0)
                img[:] = np.clip(ground[s] + grain + mottle[..., None], 0, 255)
                cy = int(size * (0.46 + 0.08 * rng.random()))
                cx = int(size * (0.46 + 0.08 * rng.random()))
                scale = int(size * (0.32 + 0.08 * rng.random()))
                body = np.clip(animal * tint[s], 0, 255)
                _stamp_shape(img, k, cy, cx, scale, body)
                img = np.clip(img + rng.normal(0, 6, img.shape), 0, 255)
                images.append(img.astype(np.uint8))
                y.append(k)
                site.append(s)
    return {
        "images": np.stack(images),
        "y": np.array(y, dtype=np.int64),
        "site": np.array(site),
        "classes": np.array(classes),
        "sites": np.array(sites),
    }


def save_bundle(bundle: dict, path: Path | None = None) -> Path:
    path = path or bundle_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(path, **bundle)
    return path


def load_bundle(path: Path | None = None) -> dict:
    path = path or bundle_path()
    z = np.load(path, allow_pickle=True)
    return {k: z[k] for k in z.files}


def ensure_bundle() -> tuple[dict, str | None]:
    """Load or build the capped analog. Always returns measured-capable data."""
    path = bundle_path()
    blocker = try_lila()
    if path.exists():
        return load_bundle(path), blocker
    bundle = generate_bundle()
    save_bundle(bundle, path)
    return bundle, blocker
