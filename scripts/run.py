"""Site holdout + SSL stub + probe metrics.

CLI: python scripts/run.py --test-site Q
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from pretext import const
from pretext.download import ensure_bundle, generate_bundle
from pretext.eval import evaluate, print_report, write_data_ts, write_metrics


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test-site", default=const.TEST_SITE)
    ap.add_argument("--ssl-epochs", type=int, default=const.SSL_EPOCHS)
    ap.add_argument("--sup-epochs", type=int, default=const.SUPERVISED_EPOCHS)
    args = ap.parse_args()

    bundle, blocker = ensure_bundle()
    if blocker:
        print("NOTE:", blocker)

    sites = sorted(set(bundle["site"].tolist()))
    if len(sites) > const.MAX_SITES:
        sys.exit(f"HARD FAIL: {len(sites)} sites over cap {const.MAX_SITES}")
    if args.test_site not in sites:
        sys.exit(f"HARD FAIL: test-site {args.test_site} not among {sites}")

    m = evaluate(
        bundle,
        test_site=args.test_site,
        ssl_epochs=args.ssl_epochs,
        sup_epochs=args.sup_epochs,
    )
    if blocker:
        m["blocker"] = blocker

    if m["success_pct"] < const.FLOOR_PCT:
        # Cap further: drop to 3 classes and re-measure once (DESIGN: cap until floor).
        print(f"below floor ({m['success_pct']:.1f}); retrying top-3 classes")
        small = generate_bundle(classes=const.TOP_K[:3], per=const.MAX_PER_CLASS_PER_SITE)
        m2 = evaluate(
            small,
            test_site=args.test_site,
            ssl_epochs=args.ssl_epochs,
            sup_epochs=args.sup_epochs,
        )
        m2["adr"] = "capped TOP_K to 3 classes after 4-class run missed 85"
        m2["blocker"] = blocker
        m = m2

    if m["success_pct"] < const.FLOOR_PCT:
        sys.exit(
            f"HARD FAIL: success_pct {m['success_pct']:.1f} < {const.FLOOR_PCT} "
            f"(random {m['random_encoder_pct']:.1f})"
        )
    if m["success_pct"] <= m["random_encoder_pct"]:
        sys.exit(
            f"HARD FAIL: probe {m['success_pct']:.1f} did not beat random encoder "
            f"{m['random_encoder_pct']:.1f}"
        )

    write_metrics(m)
    print_report(m)
    if m.get("adr"):
        print("ADR:", m["adr"])
    write_data_ts(m)


if __name__ == "__main__":
    main()
