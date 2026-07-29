# Devpost submission copy

Paste the section below into the Devpost project description. Everything else in this file is notes
for filling in the rest of the form.

---

## Problem Statement

Students finishing an introductory AI course can recite that AI can be biased. Almost none of them
have watched it happen.

The reason is that a fairness failure does not look like a failure. It does not crash and it does
not show up in accuracy. A model can report 84 percent accuracy, be telling the truth, and still
deny qualified women loans at three times the rate it denies qualified men. That gap is invisible in
every metric a beginner is taught to check. Until a student has seen it open up in front of them,
they cannot recognise it in their own work.

## Solution Overview

Bias Lab is a browser based lab where a student trains a real classifier on real data and then drags
a single decision threshold, watching harm redistribute between two groups in real time while
overall accuracy stays nearly still.

On the loan dataset, moving the threshold from 0.40 to 0.60 changes overall accuracy by two tenths
of a percentage point. Across that same drag, the number of qualified women denied goes from 21 to
33 and the demographic parity gap moves nearly seven points. The headline number does not react. The
people do.

Six fairness definitions stay on screen at once, which is the most important design decision in the
project. A student who can only see one definition at a time concludes that fairness is achievable.
A student who sees all six watches closing one gap open another, and arrives at the actual lesson:
you are not choosing whether to be unfair, you are choosing who absorbs it.

## Key Features

**Three datasets, each with a documented broken label.** Real 1994 census data relabelled as lending.
Synthetic admissions where two features describe the school rather than the student. Synthetic
medical risk modelled on the Obermeyer 2019 result, where the label is defined by spending and
spending tracks access rather than illness. Each ships with a plain language card explaining what is
wrong with its label before you train anything.

**A logistic regression written from scratch, about sixty lines,** trained live in the browser in
roughly two hundred milliseconds. No ML library. It is checked against scikit-learn on the identical
split by a committed script: worst case agreement is 6.8e-07 on predicted scores.

**Six fairness definitions computed simultaneously,** never behind a tab or a dropdown: demographic
parity, equal opportunity, equalised odds split into its true and false positive halves, predictive
parity, and calibration.

**Per group thresholds,** so the student can try to equalise one definition exactly and discover the
others will not follow.

**Confidence intervals on every gap.** Where the interval crosses zero the gap is labelled not
certain rather than reported as fact. A tool about the perils of over-reading numbers should not
teach students to over-read numbers.

**Human cost translation.** Rates become counts of people, with a hundred dot pictogram per group.

**A six step guided tour** so a judge with ninety seconds still reaches the point.

**A committed audit script** that checks each dataset card's claims against what the generator
actually produces, and fails if they diverge.

## Technologies Used

React, Vite, Tailwind, Web Workers, and a custom gradient descent implementation. Python with numpy,
pandas and scikit-learn for offline dataset generation and for the parity check, run through uv.
Vitest for 48 unit tests. Deployed on GitHub Pages.

No backend, no API, no external inference, no accounts, no API key. Everything runs client side,
including the model training, so there is nothing that can be down when you open the link. Fonts are
self hosted. First load is about 180 KB.

There is deliberately no large language model in this project. The model is trained in the browser
from scratch on real data, and the project is about interrogating machine learning rather than
calling somebody else's API.

## Target Users

Students finishing an introductory AI curriculum, and the instructors teaching them.

It was built for the ML Empowerment Build Challenge and it slots directly into the ethics module of
the challenge's own curriculum. It runs from one link, needs no setup and no accounts, and takes
about ten minutes. Any instructor running that module is welcome to use it as is.

---

## Notes for the rest of the form

**Project title:** Bias Lab

**Tagline:** Train a classifier, drag one threshold, and watch who absorbs the error.

**Repository:** https://github.com/Rickygole/Bias-Lab

**Live demo:** https://rickygole.github.io/Bias-Lab/

**Team:** solo.

**Screenshots to capture** (at least one is required, and the first should be the top of the page):

1. The full 2x2 grid mid interaction, threshold around 0.45 on the loan dataset, with visible gaps.
2. The fairness table close up, showing all six definitions and at least one gap marked not certain.
3. The human cost panel with both dot grids, showing the difference between groups.
4. The separate thresholds mode with the two coloured sliders.
5. Tour step 6, the impossibility statement.

**Prize tracks this fits:** AI for Education, Best Use of Machine Learning, Best Web AI App, Most
Impactful, Data Driven Insights.
