# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy>=2.0", "pandas>=2.2", "scikit-learn>=1.5"]
# ///
"""Builds the three Bias Lab datasets and writes them to src/data as JSON.

Run with: uv run data/build_datasets.py

Everything the browser needs is produced here. Features are standardised,
categoricals are one hot encoded, rows with missing values are dropped, and the
train and test split is fixed by seed. The browser never preprocesses anything.
"""

import json
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 20260729
ROWS = 5000
TEST_FRACTION = 0.30
PRECISION = 3

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "data"

ADULT_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data"
ADULT_COLUMNS = [
    "age", "workclass", "fnlwgt", "education", "education_num",
    "marital_status", "occupation", "relationship", "race", "sex",
    "capital_gain", "capital_loss", "hours_per_week", "native_country", "income",
]


def download_adult() -> Path:
    RAW.mkdir(parents=True, exist_ok=True)
    path = RAW / "adult.data"
    if not path.exists():
        print("downloading adult.data")
        urllib.request.urlretrieve(ADULT_URL, path)
    return path


def split_and_pack(
    features: pd.DataFrame,
    labels: np.ndarray,
    groups: np.ndarray,
    numeric: list[str],
) -> dict:
    """Splits first, then standardises using training statistics only.

    Fitting the scaler on the full frame would leak test data into the
    preprocessing. It makes no difference to the scikit-learn parity check,
    since both sides would see the same matrix, but it is still wrong and it is
    the first thing a reviewer looks for.
    """
    rng = np.random.default_rng(SEED)
    order = rng.permutation(len(features))
    cut = int(len(features) * (1 - TEST_FRACTION))
    train_idx, test_idx = order[:cut], order[cut:]

    scaled = features.copy()
    for column in numeric:
        values = features[column].astype(float)
        centre = values.iloc[train_idx].mean()
        spread = values.iloc[train_idx].std()
        scaled[column] = (values - centre) / (spread if spread > 0 else 1.0)

    matrix = np.round(scaled.to_numpy(dtype=float), PRECISION)

    def pack(idx):
        return {
            "X": matrix[idx].tolist(),
            "y": labels[idx].astype(int).tolist(),
            "g": groups[idx].astype(int).tolist(),
        }

    return {"train": pack(train_idx), "test": pack(test_idx)}


def summarise(name: str, labels: np.ndarray, groups: np.ndarray, group_names: list[str]) -> None:
    overall = labels.mean()
    a = labels[groups == 0].mean()
    b = labels[groups == 1].mean()
    test_positives = [
        int((labels[groups == g][int(len(labels[groups == g]) * (1 - TEST_FRACTION)) :]).sum())
        for g in (0, 1)
    ]
    print(
        f"{name}: n={len(labels)} base rate {overall:.3f} "
        f"| {group_names[0]} {a:.3f} | {group_names[1]} {b:.3f} | gap {abs(a - b):.3f} "
        f"| ratio {max(a, b) / max(min(a, b), 1e-9):.2f}x "
        f"| approx test positives {test_positives[0]}/{test_positives[1]}"
    )


def build_loan() -> dict:
    frame = pd.read_csv(
        download_adult(),
        header=None,
        names=ADULT_COLUMNS,
        skipinitialspace=True,
        na_values="?",
    )
    frame = frame.dropna()

    frame["approved"] = (frame["income"] == ">50K").astype(int)
    frame["group"] = (frame["sex"] == "Female").astype(int)

    frame["married"] = frame["marital_status"].str.startswith("Married").astype(int)
    frame["never_married"] = (frame["marital_status"] == "Never-married").astype(int)

    white_collar = {
        "Exec-managerial", "Prof-specialty", "Tech-support", "Sales", "Adm-clerical",
    }
    manual = {
        "Craft-repair", "Machine-op-inspct", "Transport-moving", "Handlers-cleaners",
        "Farming-fishing",
    }
    frame["white_collar"] = frame["occupation"].isin(white_collar).astype(int)
    frame["manual"] = frame["occupation"].isin(manual).astype(int)

    frame["self_employed"] = frame["workclass"].str.startswith("Self").astype(int)
    frame["government"] = frame["workclass"].str.endswith("gov").astype(int)

    frame["has_capital_gain"] = (frame["capital_gain"] > 0).astype(int)

    rng = np.random.default_rng(SEED)
    frame = frame.iloc[rng.permutation(len(frame))[:ROWS]].reset_index(drop=True)

    numeric = ["age", "education_num", "hours_per_week"]
    binary = [
        "married", "never_married", "white_collar", "manual",
        "self_employed", "government", "has_capital_gain",
    ]
    features = frame[numeric + binary]

    labels = frame["approved"].to_numpy()
    groups = frame["group"].to_numpy()
    summarise("loan", labels, groups, ["Men", "Women"])

    return {
        "id": "loan",
        "name": "Loan approval",
        "source": "real",
        "featureNames": [
            "Age", "Years of education", "Hours worked per week",
            "Married", "Never married", "White collar job", "Manual job",
            "Self employed", "Government job", "Has capital gains",
        ],
        "groupNames": ["Men", "Women"],
        "groupAttribute": "Sex",
        "positiveLabel": "Approved",
        "negativeLabel": "Denied",
        "qualifiedLabel": "would repay",
        **split_and_pack(features, labels, groups, numeric),
    }


def build_admissions() -> dict:
    rng = np.random.default_rng(SEED + 1)
    n = ROWS

    first_gen = rng.binomial(1, 0.34, n)

    ap_offered = np.clip(
        rng.normal(np.where(first_gen == 1, 8.2, 12.0), 5.0, n).round(), 0, 25
    )
    counselor_ratio = np.clip(
        rng.normal(np.where(first_gen == 1, 400, 300), 150, n), 90, 900
    )

    ability = rng.normal(0, 1, n)

    gpa = np.clip(3.05 + 0.42 * ability + rng.normal(0, 0.32, n), 1.6, 4.0)
    test_score = np.clip(
        1080 + 130 * ability + 5.5 * ap_offered + rng.normal(0, 95, n), 620, 1600
    )
    essay = np.clip(3.0 + 0.7 * ability + rng.normal(0, 0.9, n), 1, 6)
    activities = np.clip(
        rng.poisson(np.exp(0.9 + 0.28 * ability - 0.35 * first_gen), n), 0, 14
    )
    recommendation = np.clip(
        3.1 + 0.55 * ability - 0.30 * first_gen + rng.normal(0, 0.85, n), 1, 6
    )

    committee = (
        0.9 * ability
        + 0.055 * ap_offered
        + 0.30 * essay
        + 0.16 * activities
        + 0.34 * recommendation
        - 0.0012 * counselor_ratio
        + rng.normal(0, 1.45, n)
    )
    admitted = (committee > np.quantile(committee, 0.68)).astype(int)

    frame = pd.DataFrame({
        "gpa": gpa,
        "test_score": test_score,
        "ap_offered": ap_offered,
        "counselor_ratio": counselor_ratio,
        "essay": essay,
        "activities": activities,
        "recommendation": recommendation,
    })
    numeric = list(frame.columns)
    features = frame

    summarise("admissions", admitted, first_gen, ["Continuing generation", "First generation"])

    return {
        "id": "admissions",
        "name": "College admissions",
        "source": "synthetic",
        "featureNames": [
            "GPA", "Test score", "AP courses offered at school",
            "Students per counselor", "Essay rating", "Activities",
            "Recommendation rating",
        ],
        "groupNames": ["Continuing generation", "First generation"],
        "groupAttribute": "First generation status",
        "positiveLabel": "Admitted",
        "negativeLabel": "Rejected",
        "qualifiedLabel": "would succeed",
        **split_and_pack(features, admitted, first_gen, numeric),
    }


def build_medical() -> dict:
    rng = np.random.default_rng(SEED + 2)
    n = ROWS

    group = rng.binomial(1, 0.31, n)

    illness = np.clip(rng.gamma(2.4, 1.0, n), 0, None)

    age = np.clip(rng.normal(58 + 2.4 * illness, 12, n), 18, 95)
    conditions = np.clip(rng.poisson(0.55 * illness + 0.7, n), 0, 12)
    bmi = np.clip(rng.normal(27.5 + 0.55 * illness, 5.0, n), 15, 55)
    systolic = np.clip(rng.normal(124 + 2.9 * illness, 15, n), 85, 205)
    medications = np.clip(rng.poisson(0.75 * illness + 1.0, n), 0, 20)

    access = np.where(group == 1, 0.80, 1.0)
    visits = np.clip(rng.poisson(np.clip(access * (1.15 * illness + 1.0), 0.05, None), n), 0, 30)

    last_year_cost = np.clip(access * (2400 * illness + rng.normal(2600, 3400, n)), 120, None)
    next_year_cost = np.clip(access * (2400 * illness + rng.normal(2600, 3400, n)), 120, None)

    prior_cost = last_year_cost
    high_risk = (next_year_cost > np.quantile(next_year_cost, 0.74)).astype(int)

    frame = pd.DataFrame({
        "age": age,
        "conditions": conditions,
        "bmi": bmi,
        "systolic": systolic,
        "medications": medications,
        "visits": visits,
        "prior_cost": prior_cost,
    })
    numeric = list(frame.columns)
    features = frame

    summarise("medical", high_risk, group, ["White patients", "Black patients"])

    return {
        "id": "medical",
        "name": "Medical risk",
        "source": "synthetic",
        "featureNames": [
            "Age", "Chronic conditions", "BMI", "Systolic blood pressure",
            "Active medications", "Visits last year", "Healthcare spend last year",
        ],
        "groupNames": ["White patients", "Black patients"],
        "groupAttribute": "Race",
        "positiveLabel": "Flagged high risk",
        "negativeLabel": "Not flagged",
        "qualifiedLabel": "are actually sick",
        **split_and_pack(features, high_risk, group, numeric),
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for dataset in (build_loan(), build_admissions(), build_medical()):
        path = OUT / f"{dataset['id']}.json"
        path.write_text(json.dumps(dataset, separators=(",", ":")))
        print(f"wrote {path.relative_to(ROOT)} {path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
