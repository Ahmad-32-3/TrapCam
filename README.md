# TrapCam

Cameras in different places have different lighting and backgrounds. A labeled model trained at one camera often latches onto that look instead of the animal.

I pretrain an encoder with no species labels on some cameras, freeze it, and train a cheap linear head. Then I ask whether that head still works on a camera it never saw. The number I trust is that held-out camera score.

Headline is linear-probe top-1 on held-out sites, printed next to same-site probe, a supervised-from-scratch column, and a frozen random encoder. I am asking whether unlabeled pretraining learned features that survive a new camera.

## Data

## Run

```bash
python -m pytest tests/ -q
python scripts/run.py
npm --prefix web install
npm --prefix web run dev
```

`scripts/run.py` prints held-out-site probe accuracy next to same-site and supervised. Held-out site images in the SSL train pool for the probe split must fail in pytest.

## Layout

- `src/` pretext, probe, eval
- `scripts/run.py`
- `tests/` site and label leak checks
- `web/` encoder-freeze-probe diagram and same-site vs held-out results
