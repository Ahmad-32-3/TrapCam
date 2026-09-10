# Frozen protocol. Change only with one ADR line in DESIGN.md, then re-measure.

# ADR (2026-09-06): LILA Snapshot Serengeti is tens of GB. Measured run uses a
# capped synthetic multi-site trap analog (top-K classes, 5 cameras, leave-one
# site out). download.py keeps the LILA URL for a later real pull.
# ADR: 4-class NT-Xent collapsed; freeze 3 classes and a rotation-pretext CNN.

LILA_PAGE = "https://lila.science/datasets/snapshot-serengeti"

TOP_K = ("gazelle", "zebra", "wildebeest")
SITES = ("B", "C", "D", "E", "Q")
TEST_SITE = "Q"

IMG_SIZE = 32
MAX_PER_CLASS_PER_SITE = 40
MAX_SITES = 5

SSL_EPOCHS = 10
SUPERVISED_EPOCHS = 8
BATCH = 64
TEMPERATURE = 0.5
LR = 1e-3
SEED = 0
FLOOR_PCT = 85.0

DATA_NPZ = "data/bundle.npz"
METRICS_PATH = "metrics.json"
METRICS_GEN = "web/src/metrics.gen.ts"
