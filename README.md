# Bias Lab

Train a classifier, drag one threshold, watch who absorbs the error.

**Live: https://rickygole.github.io/Bias-Lab/**

Bias Lab is a browser app where a student trains a real classifier on real data, then drags one
decision threshold and watches error move between two groups while overall accuracy stays put.

On the loan dataset, moving the threshold from 0.40 to 0.60 changes overall accuracy by two tenths
of a percentage point. Over that same range, qualified women denied a loan goes from 21 to 33 and
qualified men denied goes from 102 to 167. The demographic parity gap closes by 6.8 points while the
equal opportunity gap opens by 4.8. The accuracy number does not move. The people do.

Six fairness definitions stay on screen at once, because that is the only way to see that they
cannot all be satisfied at once.

## The problem

Students finishing an introductory AI course can recite that AI can be biased. Almost none of them
have watched it happen. A fairness failure does not look like a crash or a bad accuracy number, it
looks like 84 percent accuracy and a footnote nobody reads. On this data the model approves men at
more than three times the rate it approves women, and reports 84 percent accuracy while doing it.
Until you have seen that gap open in front of you, you cannot recognise it in your own work.

## The impossibility result

This is the part that separates a fairness demo from a fairness lesson.

Let `p` be the base rate in a group, `PPV` the share of approvals that were correct, and `FNR` the
share of qualified people denied. For any classifier:

```
FPR = (p / (1 - p)) * ((1 - PPV) / PPV) * (1 - FNR)
```

If two groups have different base rates `p`, you cannot have equal PPV, equal FNR and equal FPR at
the same time. Fix any two and the identity forces the third apart. This is Chouldechova (2017).
Kleinberg, Mullainathan and Raghavan (2016) prove the same incompatibility for calibration against
equalised odds. It holds regardless of how good your model is or how carefully you collected your
data.

There are exactly two escape hatches: equal base rates, or perfect prediction. Neither is available
in the real world.

So the student's task is not to find the fair threshold. It is to understand that they are choosing
which unfairness to accept, and on whose behalf.

You can check this against the shipped data rather than taking it on faith:

```sh
uv run data/audit.py
```

It searches every threshold pair on a grid, under a realistic selection floor, and reports the best
achievable worst gap. On these three datasets it is 0.085, 0.066 and 0.101. No setting closes them.

## Running it locally

```sh
npm install
npm run dev
npm test
```

Rebuilding the datasets and checking the model needs [uv](https://docs.astral.sh/uv/):

```sh
npm run data      # regenerate all three datasets from source
npm run parity    # check the hand written model against scikit-learn
uv run data/audit.py
```

## The three datasets

Every dataset ships with a card explaining where it came from, what each feature means, and what is
wrong with the label. The label problems are the point, not a disclaimer.

**Loan approval.** Real data: the UCI Adult extract of the 1994 US Census, relabelled as a lending
decision. No bank made these decisions. Sex is the protected attribute and is deliberately withheld
from the model, which learns the gap anyway through marital status and occupation. Sex is
recoverable from the ten features it does see at AUC 0.85. The label is income above a cutoff, which
is not creditworthiness and not merit. It records what the 1994 labour market paid people, wage gap
included.

**College admissions.** Synthetic. The protected attribute is first generation status. Two features
describe the school rather than the student: how many AP courses it offers, and how many students
share one counsellor. Each correlates with first generation status at about 0.31, deliberately mild,
because real proxies usually are. The label comes from a committee score that leans on AP
coursework, a defensible policy that measures the resources of a school and calls the result student
quality.

**Medical risk.** Synthetic, modelled on the mechanism in Obermeyer et al. (2019), not on their
numbers. They found a widely deployed risk algorithm flagged Black patients at far lower rates than
White patients who were equally sick. It was never given race. It was given cost. Correcting that
proxy would have raised the share of Black patients receiving extra help from 17.7 percent to 46.5
percent.

Here illness is drawn from one distribution for both groups, so the two groups are equally sick by
construction, and only access differs. The disadvantaged group ends up flagged at about half the
rate. That ratio is a property of this generator and is not a replication of the paper's result. The
label is wrong before the model ever sees it, and no threshold fixes that.

## Implementation notes

Logistic regression written by hand, about sixty lines: sigmoid, binary cross entropy, full batch
gradient descent. No ML library. It runs in a Web Worker so the interface stays responsive.

`npm run parity` fits scikit-learn on the identical committed split with regularisation genuinely
off (`C=np.inf`, since `penalty=None` is deprecated and the default `C=1.0` silently applies L2) and
asserts agreement. Worst case across the three datasets: max score difference 6.8e-07, AUC
difference 0, max coefficient difference 2.6e-06.

Everything is client side. No backend, no API key, no external inference, nothing that can be down
when you open the link. Fonts are self hosted. The datasets are code split, so a first visit
downloads one rather than three.

Threshold changes recompute every confusion matrix in a single pass over the test set, measured at
about 0.02 milliseconds. There is no debounce anywhere near the slider, on purpose. Cause and effect
have to feel connected or the lesson dies.

Gaps carry Agresti-Caffo confidence intervals. Where the interval crosses zero the gap is marked not
certain rather than reported as fact.

## Limitations

Stated plainly, because this tool is easy to over-read.

- Binary protected attributes only. Real people are not partitioned into two groups, and the most
  important fairness failures often appear at intersections this tool cannot represent.
- Binary outcomes only. No regression, no ranking, no multi class.
- No intersectionality. You cannot ask about first generation students who are also low income.
- The test sets run to a few hundred people per group. Some gaps genuinely cannot be distinguished
  from zero at that size, which is why the intervals are shown, but it also means this is a smaller
  evidence base than any real audit would accept.
- Two of the three datasets are synthetic. They demonstrate mechanisms that occur in the world. They
  are not evidence about the world.
- The loan dataset is a 1994 census extract relabelled as lending. It is a teaching fiction.
- Real fairness auditing is considerably harder than this tool suggests. It involves contested
  ground truth, distribution shift, feedback loops where today's decisions become tomorrow's
  training data, and stakeholders who disagree about which definition should win. None of that is
  here.

## Prior work

This is not the first threshold explorable. Google PAIR's *Attacking Discrimination with Smarter
Machine Learning* (2016) put a threshold slider next to two groups and let you watch fairness
criteria disagree, and it did that well. The What-If Tool, Fairlearn and Aequitas all cover
overlapping ground for practitioners.

What is different here, and why it was worth building:

- Six definitions on screen simultaneously rather than one at a time. Seeing them trade against each
  other is the entire lesson, and it does not survive a dropdown.
- Per group thresholds, so the student can try to equalise one criterion exactly and find that the
  others will not follow.
- Confidence intervals on every gap, with small gaps marked not certain. None of the tools above
  show sampling uncertainty on a fairness metric, and it is the most common way a real audit goes
  wrong.
- The student trains the model. It is not precomputed. The weights come from gradient descent that
  ran in their browser, on a split they can inspect.
- Three datasets whose labels are broken in three different documented ways, with a committed audit
  script that checks the documentation against the generator.

## Built for

Students finishing an introductory AI curriculum, and the people teaching them. It was built for the
ML Empowerment Build Challenge and is designed to slot into the ethics module of that curriculum: it
runs from a single link, needs no setup and no accounts, and takes about ten minutes.

It has not been classroom tested. `WORKSHEET.md` is a starting point for anyone who wants to try.

## References

Chouldechova, A. (2017). Fair prediction with disparate impact: a study of bias in recidivism
prediction instruments. *Big Data*, 5(2), 153-163.

Kleinberg, J., Mullainathan, S., and Raghavan, M. (2016). Inherent trade-offs in the fair
determination of risk scores. *arXiv:1609.05807*.

Obermeyer, Z., Powers, B., Vogeli, C., and Mullainathan, S. (2019). Dissecting racial bias in an
algorithm used to manage the health of populations. *Science*, 366(6464), 447-453.

Becker, B. and Kohavi, R. (1996). Adult. UCI Machine Learning Repository.

## Licence

The code is MIT. See LICENSE.

`src/data/loan.json` is derived from the UCI Adult dataset (Becker and Kohavi, 1996,
https://doi.org/10.24432/C5XW20), which is licensed CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/). It has been modified: subsampled to 5000 rows,
features re-encoded and standardised, and the income label reframed as a loan approval. The
attribution obligation travels with that file, so the MIT grant covers the code and not that data.

`src/data/admissions.json` and `src/data/medical.json` are wholly synthetic, generated by
`data/build_datasets.py` in this repository, and are MIT.

Inter and JetBrains Mono are used under the SIL Open Font License. Both licence files ship with the
site under `public/fonts/`.
