# Light SSL: rotation pretext (RotNet) on a tiny CNN. NT-Xent collapsed here.

from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from . import augment, const


class Encoder(nn.Module):
    def __init__(self, ch: int = 32):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(16, ch, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(ch, ch, 3, padding=1),
            nn.ReLU(inplace=True),
        )
        self.dim = ch * 8 * 8

    def features(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.features(x).flatten(1)

    def pooled(self, x: torch.Tensor) -> torch.Tensor:
        return self.features(x).mean(dim=(2, 3))


class SimCLR(nn.Module):
    """RotNet head. Two-view NT-Xent collapsed on this CNN; rotation pretext is the light SSL."""

    def __init__(self, encoder: Encoder, n_rot: int = 4):
        super().__init__()
        self.encoder = encoder
        self.head = nn.Linear(encoder.dim, n_rot)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.encoder(x))


def _rotate_batch(x: torch.Tensor, k: torch.Tensor) -> torch.Tensor:
    out = []
    for i, ki in enumerate(k.tolist()):
        out.append(torch.rot90(x[i], int(ki), dims=(1, 2)))
    return torch.stack(out, 0)


def pretrain(
    images: np.ndarray,
    epochs: int = const.SSL_EPOCHS,
    batch: int = const.BATCH,
    seed: int = const.SEED,
) -> Encoder:
    rng = np.random.default_rng(seed)
    torch.manual_seed(seed)
    enc = Encoder()
    model = SimCLR(enc)
    opt = torch.optim.Adam(model.parameters(), lr=const.LR)
    n = len(images)
    model.train()
    for _ in range(epochs):
        order = rng.permutation(n)
        for i in range(0, n, batch):
            idx = order[i : i + batch]
            if len(idx) < 4:
                continue
            views = np.stack([augment.to_chw(augment.pretext_view(images[j], rng)) for j in idx])
            x = torch.from_numpy(views)
            k = torch.from_numpy(rng.integers(0, 4, size=len(idx)).astype(np.int64))
            x = _rotate_batch(x, k)
            opt.zero_grad()
            loss = F.cross_entropy(model(x), k)
            loss.backward()
            opt.step()
    enc.eval()
    return enc


@torch.no_grad()
def embed(encoder: Encoder, images: np.ndarray, batch: int = 128) -> np.ndarray:
    encoder.eval()
    out = []
    for i in range(0, len(images), batch):
        chunk = images[i : i + batch]
        x = torch.from_numpy(np.stack([augment.to_chw(im) for im in chunk]))
        out.append(encoder.pooled(x).numpy())
    return np.concatenate(out, 0)


def random_encoder(seed: int = const.SEED + 1) -> Encoder:
    torch.manual_seed(seed)
    enc = Encoder()
    enc.eval()
    return enc
