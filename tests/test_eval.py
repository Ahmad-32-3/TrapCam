import numpy as np
import pytest

from pretext.download import generate_bundle
from pretext.eval import check_no_leak, evaluate, site_split


def test_leak_injection_fails():
    bundle = generate_bundle(per=4, seed=1)
    train, test = site_split(bundle["site"], "Q")
    leaked = np.concatenate([bundle["site"][train], bundle["site"][test]])
    with pytest.raises(ValueError, match="leak"):
        check_no_leak(leaked, bundle["site"][test])


def test_site_split_is_disjoint():
    bundle = generate_bundle(per=4, seed=1)
    train, test = site_split(bundle["site"], "Q")
    assert "Q" not in set(bundle["site"][train])
    assert set(bundle["site"][test]) == {"Q"}


def test_ssl_pool_must_not_hold_test_site_for_probe_split():
    bundle = generate_bundle(per=4, seed=2)
    ssl_pool = bundle["site"]  # all sites, including held-out
    with pytest.raises(ValueError, match="leak"):
        check_no_leak(ssl_pool, ["Q"])


def test_evaluate_held_out_beats_random_and_clears_floor():
    bundle = generate_bundle(per=24, seed=0)
    m = evaluate(bundle, test_site="Q", ssl_epochs=8, sup_epochs=4, seed=0)
    assert m["n_sites_test"] == 1
    assert m["n_sites_train"] == 4
    assert m["chance_pct"] == pytest.approx(100.0 / 3)
    assert "Q" not in m["train_sites"]
    assert m["success_pct"] == m["probe_pct"]
    assert m["success_pct"] >= 85
    assert m["success_pct"] > m["random_encoder_pct"]
    assert m["same_site_pct"] >= m["success_pct"] - 15
