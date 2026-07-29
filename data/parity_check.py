# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy>=2.0", "scikit-learn>=1.5"]
# ///
"""Checks the hand written gradient descent against scikit-learn.

Run with: uv run data/parity_check.py

Both are fit on the identical committed split with no regularisation, which for
recent scikit-learn means C=inf rather than the deprecated penalty=None. The
default C=1.0 applies L2 and will produce a small systematic disagreement that
looks like a convergence bug and is not one.

We assert on predicted test scores, on AUC, and on coefficients. Score agreement
is what the app actually depends on. Coefficients are included because they do
in fact agree once the reference is genuinely unregularised, and a dataset that
drifts toward separability will show up here first.
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"

EPOCHS = 4000
LR = 1.5
SCORE_TOLERANCE = 1e-3
AUC_TOLERANCE = 1e-4
COEF_TOLERANCE = 1e-3


def js_fit(path: Path) -> dict:
    result = subprocess.run(
        ["node", str(ROOT / "data" / "js_scores.mjs"), str(path), str(EPOCHS), str(LR)],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def check(path: Path) -> bool:
    data = json.loads(path.read_text())
    Xtr = np.array(data["train"]["X"])
    ytr = np.array(data["train"]["y"])
    Xte = np.array(data["test"]["X"])
    yte = np.array(data["test"]["y"])

    reference = LogisticRegression(C=np.inf, solver="lbfgs", max_iter=20000, tol=1e-10)
    reference.fit(Xtr, ytr)
    sk_scores = reference.predict_proba(Xte)[:, 1]

    ours = js_fit(path)
    js_scores = np.array(ours["scores"])

    score_gap = float(np.abs(sk_scores - js_scores).max())
    auc_gap = abs(roc_auc_score(yte, sk_scores) - roc_auc_score(yte, js_scores))
    coef_gap = float(np.abs(reference.coef_[0] - np.array(ours["weights"])).max())

    ok = (
        score_gap < SCORE_TOLERANCE
        and auc_gap < AUC_TOLERANCE
        and coef_gap < COEF_TOLERANCE
    )
    print(
        f"{data['id']:<12} max score gap {score_gap:.2e} | auc gap {auc_gap:.2e} "
        f"| max coef gap {coef_gap:.2e} | auc {roc_auc_score(yte, js_scores):.4f} "
        f"| {'pass' if ok else 'FAIL'}"
    )
    return ok


def main() -> None:
    results = [check(DATA / f"{name}.json") for name in ("loan", "admissions", "medical")]
    if not all(results):
        sys.exit(1)
    print("parity ok")


if __name__ == "__main__":
    main()
