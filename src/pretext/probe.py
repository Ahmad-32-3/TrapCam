# Linear probe on frozen embeddings. Supervised-from-scratch CNN for the ablation.

from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from . import augment, const, ssl


def fit_probe(z: np.ndarray, y: np.ndarray, seed: int = const.SEED):
    clf = make_pipeline(
        StandardScaler(),
        LogisticRegression(max_iter=400, random_state=seed),
    )
    clf.fit(z, y)
    return clf


def probe_pct(clf, z: np.ndarray, y: np.ndarray) -> float:
    return 100.0 * float(clf.score(z, y))


def supervised_pct(
    images_train: np.ndarray,
    y_train: np.ndarray,
    images_test: np.ndarray,
    y_test: np.ndarray,
    n_classes: int,
    epochs: int = const.SUPERVISED_EPOCHS,
    batch: int = const.BATCH,
    seed: int = const.SEED,
) -> float:
    torch.manual_seed(seed)
    rng = np.random.default_rng(seed)
    enc = ssl.Encoder()
    head = nn.Linear(enc.dim, n_classes)
    opt = torch.optim.Adam(list(enc.parameters()) + list(head.parameters()), lr=const.LR)
    n = len(images_train)
    enc.train()
    head.train()
    for _ in range(epochs):
        order = rng.permutation(n)
        for i in range(0, n, batch):
            idx = order[i : i + batch]
            x = torch.from_numpy(np.stack([augment.to_chw(images_train[j]) for j in idx]))
            y = torch.from_numpy(y_train[idx])
            opt.zero_grad()
            loss = nn.functional.cross_entropy(head(enc(x)), y)
            loss.backward()
            opt.step()
    enc.eval()
    head.eval()
    with torch.no_grad():
        x = torch.from_numpy(np.stack([augment.to_chw(im) for im in images_test]))
        pred = head(enc(x)).argmax(1).numpy()
    return 100.0 * float((pred == y_test).mean())
