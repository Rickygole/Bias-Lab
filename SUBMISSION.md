# Devpost submission copy

Paste the section below into the Devpost project description. Everything else in this file is notes
for filling in the rest of the form.

---

## Problem Statement

A classifier can report 84 percent accuracy, be telling the truth, and approve men for loans at more
than three times the rate it approves women. Nothing crashes. The accuracy number does not move.

That is what makes fairness failures hard to teach. They do not look like failures. Students
finishing an introductory AI course can recite that AI can be biased, but almost none of them have
watched it happen, and you cannot recognise in your own work something you have never seen.

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

There is no large language model in this project, and that is a decision rather than a gap. An LLM
would explain fairness to the student. This tool makes the student produce the evidence: train a
real classifier, move a real threshold, and watch a real number change on a test set they can
inspect. The model is trained live in the browser by hand written gradient descent, verified against
scikit-learn to within 6.8e-07. The lesson only holds if the student did the training and dragged
the slider, so that is the one step it does not hand off.

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

**Prize tracks, in order of realistic odds:** Data Driven Insights (this is literally what the
project is, and the field will be thin). Best Use of Machine Learning (the from scratch plus parity
check story is unusually verifiable). AI for Education. Best Overall is genuinely in play.

Do not chase Most Impactful, which at social good hackathons goes to projects with a nameable
beneficiary, or Most Innovative, where the Google PAIR prior art is a liability rather than an
asset. The prior work is acknowledged in the README along with the specific deltas.

**Screenshot warning:** shots 2 and 3 render a racial health disparity as large numbers. Frame them
so the left rail is in the picture, because that is where the synthetic data marker lives. A cropped
screenshot of that panel with no context is how a teaching tool ends up quoted as a finding.

## The demo video

This matters more than the screenshots. The argument of this project is a trade off, and a trade off
is a change over time, which a still image cannot show. Sixty seconds, screen recording, voice over
if there is time and captions if there is not.

**0:00 to 0:08.** Page loads and trains itself. "Bias Lab trains a real classifier in your browser,
then asks you to move one slider."

**0:08 to 0:18.** Point at the left rail. "Logistic regression, written by hand, no machine learning
library. It matches scikit-learn to seven decimal places."

**0:18 to 0:38.** The important twenty seconds. Drag the threshold slowly from 0.40 to 0.60. Keep the
cursor near the accuracy number so the viewer watches it not move, then move to the human cost
panel. "Accuracy went from 83.6 to 83.4. Over that same drag, qualified women denied went from 21 to
33."

**0:38 to 0:50.** Switch to separate thresholds. Close one gap. "You can equalise one definition.
Watch what the others do."

**0:50 to 1:00.** Tour step six, hold on the impossibility sentence. End on the URL.

Do not narrate the whole interface. The single job of this video is that the viewer watches the
accuracy number hold still while the human numbers move.

## Screenshots

Captured and committed under `docs/screenshots`. Upload in this order, because the first is what
appears in the Devpost gallery listing.

1. `01-loan-overview.png` — the whole instrument on the loan dataset at threshold 0.45.
2. `02-medical.png` — the medical dataset. The synthetic data marker is in frame on the left, which
   is deliberate and should not be cropped out.
3. `03-admissions.png` — the admissions dataset, showing proxy discrimination.
4. `04-separate.png` — separate thresholds per group.
5. `05-tour.png` — the guided tour docked at the bottom, reading the live accuracy.
6. `06-mobile.png` — the phone layout.
