# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy>=2.0", "scikit-learn>=1.5"]
# ///
"""Audits the datasets against the claims the dataset cards make about them.

Run with: uv run data/audit.py

A card that describes bias the generator does not produce is the worst failure
this project can have, so the claims are checked here rather than trusted. Each
check prints its number and passes or fails on a stated threshold.
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

failures: list[str] = []


def check(label: str, ok: bool, detail: str) -> None:
    print(f"  [{'pass' if ok else 'FAIL'}] {label}: {detail}")
    if not ok:
        failures.append(label)


def load(name: str) -> dict:
    return json.loads((DATA / f"{name}.json").read_text())


def scores_for(name: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    result = subprocess.run(
        ["node", str(ROOT / "data" / "js_scores.mjs"), str(DATA / f"{name}.json"), str(EPOCHS), str(LR)],
        capture_output=True,
        text=True,
        check=True,
    )
    data = load(name)
    return (
        np.array(json.loads(result.stdout)["scores"]),
        np.array(data["test"]["y"]),
        np.array(data["test"]["g"]),
    )


def rates(scores, y, g, group, threshold):
    mask = g == group
    predicted = scores[mask] >= threshold
    actual = y[mask] == 1
    tp = int((predicted & actual).sum())
    fp = int((predicted & ~actual).sum())
    fn = int((~predicted & actual).sum())
    tn = int((~predicted & ~actual).sum())
    return {
        "tpr": tp / (tp + fn) if tp + fn else None,
        "fpr": fp / (fp + tn) if fp + tn else None,
        "ppv": tp / (tp + fp) if tp + fp else None,
        "selected": tp + fp,
        "n": tp + fp + fn + tn,
    }


def minimax_gap(name: str, floor: float, split: bool) -> float:
    scores, y, g = scores_for(name)
    grid = np.arange(0.05, 0.96, 0.01)
    pairs = ((a, b) for a in grid for b in (grid if split else [None]))
    best = 1.0

    for a, b in pairs:
        ra = rates(scores, y, g, 0, a)
        rb = rates(scores, y, g, 1, a if b is None else b)
        if None in (ra["tpr"], ra["fpr"], ra["ppv"], rb["tpr"], rb["fpr"], rb["ppv"]):
            continue
        if ra["selected"] / ra["n"] < floor or rb["selected"] / rb["n"] < floor:
            continue
        worst = max(
            abs(ra["tpr"] - rb["tpr"]),
            abs(ra["fpr"] - rb["fpr"]),
            abs(ra["ppv"] - rb["ppv"]),
        )
        best = min(best, worst)

    return best


def audit_impossibility() -> None:
    print("\nimpossibility holds under a realistic operating floor")
    for name in ("loan", "admissions", "medical"):
        single = minimax_gap(name, 0.10, split=False)
        split = minimax_gap(name, 0.10, split=True)
        check(
            f"{name} single threshold",
            single > 0.05,
            f"best achievable worst gap {single:.3f}",
        )
        check(
            f"{name} separate thresholds",
            split > 0.02,
            f"best achievable worst gap {split:.3f}",
        )


def audit_no_leakage() -> None:
    print("\nno single feature carries the label")
    for name in ("loan", "admissions", "medical"):
        data = load(name)
        Xtr = np.array(data["train"]["X"])
        ytr = np.array(data["train"]["y"])
        Xte = np.array(data["test"]["X"])
        yte = np.array(data["test"]["y"])

        full = LogisticRegression(C=np.inf, solver="lbfgs", max_iter=20000).fit(Xtr, ytr)
        full_auc = roc_auc_score(yte, full.predict_proba(Xte)[:, 1])

        best = 0.0
        best_name = ""
        for j in range(Xtr.shape[1]):
            auc = roc_auc_score(yte, Xte[:, j])
            auc = max(auc, 1 - auc)
            if auc > best:
                best, best_name = auc, data["featureNames"][j]

        check(
            f"{name} single feature share",
            best / full_auc < 0.98,
            f"best single feature {best_name} auc {best:.3f} against full model {full_auc:.3f}",
        )


def audit_protected_attribute_is_not_recoverable_outright() -> None:
    print("\nprotected attribute is inferable but not trivially so")
    for name, ceiling in (("loan", 0.92), ("admissions", 0.92), ("medical", 0.92)):
        data = load(name)
        Xtr = np.array(data["train"]["X"])
        gtr = np.array(data["train"]["g"])
        Xte = np.array(data["test"]["X"])
        gte = np.array(data["test"]["g"])
        model = LogisticRegression(C=np.inf, solver="lbfgs", max_iter=20000).fit(Xtr, gtr)
        auc = roc_auc_score(gte, model.predict_proba(Xte)[:, 1])
        check(
            f"{name} group recoverable at auc",
            0.55 < auc < ceiling,
            f"{auc:.3f}, so proxies exist without the attribute being handed over",
        )


def audit_medical_card() -> None:
    print("\nmedical card claims match the medical generator")
    source = (ROOT / "data" / "build_datasets.py").read_text()
    check(
        "illness is equal across groups",
        "rng.gamma(2.4, 1.0, n), 0, None" in source and "0.22 * group" not in source,
        "generator draws illness from one distribution for both groups",
    )

    data = load("medical")
    y = np.array(data["train"]["y"] + data["test"]["y"])
    g = np.array(data["train"]["g"] + data["test"]["g"])
    ratio = y[g == 0].mean() / y[g == 1].mean()
    check(
        "flag ratio is large but not a caricature",
        1.5 < ratio < 3.5,
        f"{ratio:.2f}x. This is a property of the generator. The paper reported a different "
        f"quantity, the share of Black patients receiving extra help rising from 17.7 to 46.5 "
        f"percent once the proxy was corrected, so the two numbers are not comparable.",
    )

    X = np.array(data["train"]["X"] + data["test"]["X"])
    spend = X[:, data["featureNames"].index("Healthcare spend last year")]
    deciles = np.quantile(spend, np.linspace(0, 1, 11))
    empty = 0
    for i in range(10):
        band = (spend >= deciles[i]) & (spend <= deciles[i + 1])
        if band.sum() and y[band & (g == 1)].size and y[band & (g == 1)].mean() == 0:
            empty += 1
    check(
        "disadvantaged group is not wholly excluded",
        empty <= 2,
        f"{empty} of 10 spend deciles flag nobody in the disadvantaged group",
    )


def audit_admissions_card() -> None:
    print("\nadmissions card claims match the admissions generator")
    data = load("admissions")
    X = np.array(data["train"]["X"] + data["test"]["X"])
    g = np.array(data["train"]["g"] + data["test"]["g"])
    names = data["featureNames"]

    for field in ("AP courses offered at school", "Students per counselor"):
        column = X[:, names.index(field)]
        correlation = float(np.corrcoef(column, g)[0, 1])
        check(
            f"{field} correlates with first generation status",
            0.15 < abs(correlation) < 0.70,
            f"r = {correlation:+.3f}, strong enough to act as a proxy without being the attribute",
        )


def main() -> None:
    audit_impossibility()
    audit_no_leakage()
    audit_protected_attribute_is_not_recoverable_outright()
    audit_medical_card()
    audit_admissions_card()

    print()
    if failures:
        print(f"{len(failures)} audit checks failed:")
        for name in failures:
            print(f"  {name}")
        sys.exit(1)
    print("all audit checks passed")


if __name__ == "__main__":
    main()
