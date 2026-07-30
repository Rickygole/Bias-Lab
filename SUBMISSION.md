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
roughly a quarter of a second. No ML library. It is checked against scikit-learn on the identical
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

React, Vite, Tailwind and Web Workers on the front end. A logistic regression implemented from
scratch: sigmoid, binary cross entropy, full batch gradient descent, about sixty lines, no machine
learning library. Python with numpy, pandas and scikit-learn offline, run through uv, for dataset
generation and for the correctness checks. Vitest for 78 unit tests including a server side render
smoke test. Deployed on GitHub Pages.

Three things in the repository verify the work rather than assert it, and each runs in one command:

- `npm run parity` fits scikit-learn on the identical committed split with regularisation genuinely
  disabled and asserts agreement with the hand written model. Worst case across three datasets:
  6.8e-07 on predicted scores, zero difference in AUC, 2.6e-06 on coefficients.
- `uv run data/audit.py` checks every claim each dataset card makes against what the generator
  actually produces, and fails the build if a card describes bias the data does not contain.
- `npm test` includes a test that searches the entire threshold grid and proves the impossibility
  result holds on the shipped data, plus its converse: the gaps do close when base rates are equal.

No backend, no API, no external inference, no accounts, no API key. Everything runs client side,
including the model training, so there is nothing that can be down when a judge opens the link.
Fonts are self hosted. First load is about 187 KB gzipped. It works offline after first load.

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
about ten minutes. It has not been classroom tested yet. WORKSHEET.md in the repository is a
sixteen question worksheet with an answer key for anyone who wants to run it.

## Social Impact Statement

The beneficiary is specific and reachable: the 700 or so students in this challenge, and every
future cohort that goes through the ML Empowerment Foundation curriculum.

That curriculum teaches, correctly, that AI can be biased. Every intro curriculum does. What almost
none of them can do is show it, because showing it requires a working model, real data with a real
base rate difference, and a control the student can move. This tool supplies all three from a single
link, with no install, no account, no API key and no cost, which matters for exactly the students an
accessibility focused programme is trying to reach. A student on a school Chromebook gets the same
experience as one on a workstation, because the model trains on their own machine in a quarter of a
second.

The larger claim is smaller than it sounds, and that is deliberate. This tool will not make any
deployed system fairer. What it can do is change what a student notices. A beginner who has watched
84 percent accuracy hold steady while one group's denial rate climbs will, for the rest of their
career, ask a second question after seeing an accuracy number. That is a small change repeated
across a cohort, and it is the honest size of the impact.

The material is free, MIT licensed, and ready to embed. The Foundation is welcome to use it in the
ethics module as it stands.

---

## Notes for the rest of the form

**Project title:** Bias Lab

**Tagline:** Train a classifier, drag one threshold, and watch who absorbs the error.

**Repository:** https://github.com/Rickygole/Bias-Lab

**Live demo:** https://rickygole.github.io/Bias-Lab/

**Team:** solo.

**Screenshots:** already captured and committed under `docs/screenshots`. See the list at the
bottom of this file for the upload order.

**Prizes.** The official rules list four, not the twelve on the overview page. Aim accordingly.

1. **Best Overall.** Judged on creativity, technical skill and real world impact together. This is
   the main target. The technical case is the strongest part of the submission and it is verifiable
   in one command.
2. **Best Beginner.** Do not enter this framing. It is for participants new to AI or programming.
   Claiming it would be false and a judge comparing it against the parity check would see that.
3. **Most Innovative.** Weaker ground. Google PAIR shipped a threshold explorable in 2016 and the
   README says so. Lead with the deltas that are real: six definitions at once, confidence
   intervals on fairness metrics, a model the student trains, and the named warning when equality
   is bought by approving nobody. Do not use the word novel.
4. **Most Impactful.** Worth entering, with the specific angle below rather than a general appeal.

**Screenshot warning:** shots 2 and 3 render a racial health disparity as large numbers. Frame them
so the left rail is in the picture, because that is where the synthetic data marker lives. A cropped
screenshot of that panel with no context is how a teaching tool ends up quoted as a finding.

## The demo video

This matters more than the screenshots. The argument of this project is a trade off, and a trade off
is a change over time, which a still image cannot show. Sixty seconds, screen recording, voice over
if there is time and captions if there is not.

**0:00 to 0:10.** Open the link. The page trains itself in about a quarter of a second, so there is
nothing to click and nothing to wait for. Point at the Model card in the left rail: 4,000 epochs, and
a loss curve running from 0.693 down to 0.407. Say: "That 0.693 is not a round number, it is the
natural log of 2, which is exactly the loss of a coin flip. The model starts at chance and learns
from there, in your browser, by gradient descent I wrote by hand."

**0:10 to 0:18.** Click **Reset**. The model retrains and the loss curve redraws in front of the
viewer. That is the training moment, and it is the only way to show it now that training is
automatic. Say: "No machine learning library, and it matches scikit-learn to seven decimal places.
There is one command in the repository that proves it."

Switching datasets retrains too, if you would rather show it that way.

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

1. `01-loan-overview.png` is the whole instrument on the loan dataset at threshold 0.45.
2. `02-medical.png` is the medical dataset. The synthetic data marker sits in frame on the left,
   which is deliberate and should not be cropped out.
3. `03-admissions.png` is the admissions dataset, showing proxy discrimination.
4. `04-separate.png` is separate thresholds per group.
5. `05-tour.png` is the guided tour docked at the bottom, reading the live accuracy.
6. `06-mobile.png` is the phone layout.
