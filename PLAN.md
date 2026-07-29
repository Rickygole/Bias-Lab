# Bias Lab — build plan

## Context

Ricky is submitting to the **ML Empowerment Build Challenge 2.0** on Devpost (student-only,
solo allowed, judged 30% Technical / 20% Creativity / 20% Impact / 15% Design / 15%
Presentation). He has written a complete build specification for **Bias Lab** and it is
authoritative: this plan implements it, it does not revise it.

Bias Lab is a client-side teaching instrument. A student picks one of three preloaded
datasets, trains a logistic regression in the browser, and drags a decision threshold while
watching overall accuracy sit still and per-group error rates diverge. The payload is the
Kleinberg–Mullainathan–Raghavan / Chouldechova impossibility result: when base rates differ
between groups, the fairness definitions are mutually incompatible, and the student is not
choosing whether to be unfair but who absorbs it.

Explicitly out of scope, per the spec: file upload, neural nets, any backend, bias-mitigation
algorithms, LLM integration, accounts.

Nothing exists yet. This is a greenfield build in an empty directory.

## Decisions already made

| | |
|---|---|
| Repo | Public, **`Rickygole/Bias-Lab`** — already created, currently empty |
| Local clone | `~/Bias-Lab` (match the remote name; do not lowercase it) |
| Vite base | **`'/Bias-Lab/'`** → serves at `https://rickygole.github.io/Bias-Lab/` |
| Schedule | The 17-day order as written in the spec |
| Stack | React + Vite + Tailwind + Recharts, plain JS, `useReducer`, no ML library |

**Case matters.** GitHub named the repo `Bias-Lab`, not `bias-lab`. GitHub Pages URLs are
case-sensitive, so `base: '/bias-lab/'` would produce exactly the blank-page-with-404-assets
failure the spec flags as the most common way this deploy dies. Everything — `base`, the clone
directory, the README badge links, the Devpost submission URL — uses `Bias-Lab`.

## Two open technical issues to settle before day 6

These are flagged now because both land in Panel C, the panel the spec calls the most
important in the app. Recommendations given; they need a yes/no.

### A. Calibration does not move when the threshold moves

Calibration is a property of the *scores*, not of the decision. Whatever the student does with
the slider, a per-group calibration error is a constant. That is mathematically correct and
pedagogically fatal: tour steps 4 and 5 ask the student to equalize one metric and watch
another break, and a frozen row cannot do that.

The threshold-visible face of the same impossibility is **Chouldechova's** version:
**PPV (predictive parity), FPR, and FNR cannot all be equal when prevalence differs.** Every
term in that one *does* move with the slider, and it is the COMPAS/ProPublica result, which is
the one a judge who knows the field will recognize.

**Recommendation:** keep all four named definitions in the table so the student learns the
vocabulary, and render the calibration row in two parts — a static per-group ECE (10 bins),
labeled as a property of the model rather than the threshold, plus **predictive parity (PPV)**
as the live row directly beneath it. The tour's impossibility beat then runs on
PPV × FPR × FNR, which actually animates. Cite both results in the README.

### B. Equalized odds is two numbers, not one

TPR and FPR. **Recommendation:** render it as two sub-rows (TPR gap, FPR gap) under one
"Equalized odds" heading rather than collapsing to `max(|ΔTPR|, |ΔFPR|)`. Collapsing hides
exactly the trade the app exists to show, and the spec's rule — all metrics visible at once,
never a dropdown — points the same way.

## Files

```
~/bias-lab/
  data/
    build_datasets.py       # committed generation script; PEP-723 inline deps, run via uv
    cards.md                # the three 200-word dataset cards, authored alongside the data
    raw/                    # gitignored; adult.data downloaded here
  src/
    data/*.json             # loan, admissions, medical — committed, <400KB each
    ml/
      logreg.js             # predict / loss / step / train, ~60 lines
      train.worker.js
      metrics.js            # pure functions, no React
      metrics.test.js
    components/
      TopBar.jsx LeftRail.jsx Tour.jsx AccuracyBanner.jsx
      ScoreDistribution.jsx ConfusionMatrices.jsx FairnessTable.jsx HumanCost.jsx
    state/appReducer.js
  .github/workflows/deploy.yml
  vite.config.js tailwind.config.js README.md
```

## Day 0 — setup (before the spec's day 1)

Day 0 is also the unblock for the Ultraplan handoff. Cloud agents require a git repository and
this was invoked from `/Users/rickygole`, which is not one — no home-directory `git init` was
performed and none should be. Once `~/bias-lab` exists as a repo with the plan committed,
Ultraplan can be re-run from there against real project context.

1. The remote already exists and is empty. Clone it, commit the plan, then scaffold Vite +
   React + Tailwind + Recharts:
   `git clone https://github.com/Rickygole/Bias-Lab.git ~/Bias-Lab`
2. Set `base: '/Bias-Lab/'` in `vite.config.js` immediately, not on day 14. The spec correctly
   names this as the top deploy failure mode; getting it wrong late costs a debugging session
   under deadline.
3. **The `gh` token is missing the `workflow` scope** (it has `gist, read:org, repo`). Pushing
   `.github/workflows/deploy.yml` will be rejected. Ricky runs, once:
   `! gh auth refresh -h github.com -s workflow`
   Fallback if that is inconvenient: an `npm run deploy` script that force-pushes `dist/` to a
   `gh-pages` branch, with Pages set to serve from that branch. No workflow file, no scope
   needed, manual deploys.
4. Commit a hello-world and deploy it *on day 0*. Proving the Pages URL works while the app is
   trivial removes the single highest-consequence unknown from day 14.

## Days 1–2 — data

`data/build_datasets.py`, run under `uv` with an isolated Python 3.12 and inline dependency
metadata. System Python is 3.9.6 with no pandas/numpy/sklearn; nothing gets installed globally
and the script stays reproducible for a judge.

- **Loan** — real UCI Adult/Census. `https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data`
  is live and returns raw headerless CSV (verified; the `static/public/2/adult.zip` and OpenML
  mirrors are also up as fallbacks). Protected attribute `sex`, label `income > 50K` reframed
  as loan approval. The base-rate gap here is large, which is what makes the impossibility bite.
- **Admissions** — synthetic. Protected attribute: first-generation status. Include a proxy
  feature (AP courses offered at the school) that correlates with it without being it.
- **Medical** — synthetic, modeled on cost-as-proxy-for-need. Protected attribute: race. The
  label is itself biased; the card says so plainly.

Sample to 2,000–5,000 rows. Standardize numerics, one-hot categoricals, drop missing at build
time so runtime never sees a null. Fixed-seed 70/30 split, emitted in the JSON — all metrics
come from test only, and the UI says so. Write the three dataset cards now, in the data.

## Days 3–4 — logistic regression

Hand-rolled gradient descent on cross-entropy in `logreg.js`, in a Web Worker posting loss back
every 10 epochs. Main-thread fallback with `setTimeout` yields if the worker fights back for
more than an hour.

**On the sklearn parity check:** the spec asks for coefficients matching to three decimals.
That will not happen against sklearn's defaults — `LogisticRegression` applies L2 at `C=1.0`
and solves with lbfgs, and unregularized coefficients on near-separable features drift without
bound. Either compare against `LogisticRegression(penalty=None, solver='lbfgs', max_iter=10000)`
and run GD to a real convergence tolerance, or — better, and what the parity script should
assert — compare **predicted scores** (max abs difference < 1e-3), plus AUC and accuracy. Score
agreement is what the app's correctness actually depends on; coefficient agreement is a proxy
for it that happens to be brittle.

## Days 5–6 — metrics engine

Pure functions in `metrics.js`, no React import, unit tested against hand-computed values on a
tiny fixture where every count is checkable by eye. All four definitions per group, plus the
Panel C decisions above.

Scores computed once into a frozen `Float32Array` alongside `Uint8Array` labels and groups.
Threshold change recomputes confusion matrices in one pass over ~3k rows — sub-millisecond.
**Never debounce.** ROC and histograms precomputed once at load.

This is the part a knowledgeable judge will check. It is worth more test coverage than
everything else combined.

## Days 7–9 — UI, complete and ugly

Layout per spec: 64px top bar, fixed 320px left rail, 2×2 main grid, persistent accuracy
banner. All four panels functional, slider wired, nothing styled.

**One deviation to consider on Panel A:** the score-distribution histogram needs a threshold
line the student drags directly. Recharts `ReferenceLine` is not draggable and making it so
means fighting the library on the one interaction with a 16ms budget. Two overlaid 20-bin
histograms are ~40 SVG rects — hand-rolling that panel in raw SVG is less code than the
workaround. Keep Recharts for the loss sparkline and the ROC curve, where it earns its place.

## Day 10 — per-group thresholds

Mode toggle animates one slider into two, each tinted with its group color, with the one line
of text about treating groups differently being illegal in some contexts and required for
fairness in others. This is the day the impossibility demonstration works end to end.

## Days 11–12 — design pass

Do not cut. Palette, Inter + monospace tabular numerals for every number, 8px spacing, 250ms
count-ups, 200ms bar transitions, no bounce, no emoji, red reserved for errors only.

## Day 13 — guided tour, mobile

Five steps, final copy already written in the spec — use it verbatim. Mobile: single column,
panel order A, C, D, B. Not broken, not polished, half a day maximum.

## Day 14 — README, submission, deploy

README structure per spec, including the impossibility section with real math and citations,
and the limitations section (binary attributes, binary outcomes, no intersectionality, real
auditing is harder than this suggests).

Devpost description uses their five requirements as literal headers, plus the unprompted line
that this was built for the challenge's own ethics module and can be embedded in it.

## Days 15–17 — buffer

Treat **Aug 14** as final.

> **Unresolved and worth an email to the hackathon manager today:** the overview page says the
> deadline is Aug 15 @ 2:45am EDT; the official rules page says the submission period ends
> **July 30, 2026 @ 9:00 PM PDT**. That is a 16-day discrepancy, not a timezone offset. Day 0's
> deploy-something-immediately step is partial insurance, but if July 30 turns out to be real
> the schedule has to collapse and that decision needs to be made in the next two days.

## Verification

- `npm test` — metrics unit tests against hand-computed fixtures; logreg convergence test.
- `uv run data/parity_check.py` — trains sklearn on the identical committed split, asserts max
  score difference < 1e-3 and AUC agreement, for all three datasets.
- Chrome DevTools performance trace while dragging the threshold: confirm sub-16ms
  slider-to-repaint, first paint < 1.5s, training < 3s.
- `npm run build` then check gzipped bundle < 500KB.
- Open the live Pages URL in a fresh Chrome profile that has never seen the project. Complete
  the tour end to end. Confirm no console errors and no 404s on assets — this is what catches
  a wrong `base`.
- Load on a phone. Confirm every panel is reachable and the slider is draggable.
