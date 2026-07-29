# Bias Lab worksheet

For an instructor running this in an ethics module. Takes about twenty minutes including
discussion. Students work in the browser at https://rickygole.github.io/Bias-Lab/ and write their
answers down. There is nothing to install and no account to create.

The state lives in the URL, so you can link students directly to a moment and they can paste back
what they found. Part 1 starts here:
https://rickygole.github.io/Bias-Lab/?dataset=loan&t=0.40

Answers are at the bottom. They are approximate because the model is retrained in each student's
browser, but the direction of every answer is fixed.

---

## Part 1. The number that does not move

Use the **Loan approval** dataset.

1. Set the threshold to **0.40**. Write down the overall accuracy, and write down how many qualified
   people in each group were denied.

2. Now set the threshold to **0.60**. Write down the same three numbers again.

3. How much did overall accuracy change? How much did the number of denied qualified women change,
   as a share of all qualified women?

4. In one sentence: if you were only shown the accuracy number, what would you have concluded about
   what just happened?

## Part 2. The trade

5. Still on the loan dataset, try to make the **demographic parity** gap as small as you can. Write
   down the threshold you used and the gap you reached.

6. At that threshold, what has happened to the **equal opportunity** gap? Write it down.

7. Now do the opposite. Make equal opportunity as small as you can, and record what demographic
   parity does.

8. In one sentence: what is the relationship between those two definitions on this data?

## Part 3. The impossibility

9. Switch to **Separate thresholds**. You can now set a different bar for each group.

10. Try to get **all** of the live gaps under 5 percent at the same time. Record the closest you
    managed and which definition refused to cooperate.

11. Read the note under the fairness table about calibration. Why does calibration not move when you
    drag the slider? What does that tell you about the difference between a score and a decision?

## Part 4. Uncertainty

12. Find a gap marked **not certain**. What does that label mean? Is the gap zero?

13. Switch to the **Medical risk** dataset. Look at the group sizes in the confusion matrices. Why
    are more of the gaps uncertain here than on the loan dataset?

## Part 5. The label

14. Open the dataset card for **Medical risk** and read it. The label is defined by healthcare
    spending. What is wrong with using spending as a measure of who is sick?

15. Suppose you fixed the threshold perfectly, so that every fairness gap on screen was zero. Would
    the tool now be fair to the patients in that data? Explain your answer in two sentences.

---

## Discussion questions

- Setting a different threshold for each group is illegal in some contexts and required for fairness
  in others. Which contexts, and why do you think the law lands differently in each?
- Who should decide which definition of fairness a deployed system optimises for? The engineer, the
  company, the regulator, or the people affected?
- Question 15 is the one that matters. A model can pass every metric on this page and still be built
  on a label that encodes who had access rather than who was sick. What would you need in order to
  detect that, and would any amount of threshold tuning get you there?

---

## Answers

1 and 2. Accuracy is about 83.6 percent at 0.40 and about 83.4 percent at 0.60. Qualified people
denied goes from roughly 102 men and 21 women to roughly 167 men and 33 women.

3. Accuracy moves about two tenths of a point. The share of qualified women denied goes from about
45 percent to about 70 percent.

4. That nothing much happened. That is the point of the exercise.

5 to 8. Demographic parity narrows as the threshold rises, and equal opportunity widens over the
same range. They move in opposite directions, so closing one opens the other. Students should find
they cannot zero both.

10. They will not manage it. The best achievable worst gap on this dataset, searched over every
threshold pair under a realistic selection floor, is about 8.5 percent. `data/audit.py` in the
repository computes this.

11. Calibration is a property of the scores the model produces, and the threshold only decides where
to cut those scores. Changing where you cut does not change what a score of 0.7 means. A score is a
statement about probability. A decision is a policy applied to that statement, and only the policy
is yours to move.

12. It means the confidence interval on the gap crosses zero, so this test set is too small to
distinguish that gap from no gap. It does not mean the gap is zero. It means you do not know.

13. The disadvantaged group has far fewer positive cases in the test set, so every rate computed on
that group is estimated from fewer people and the interval around it is wider.

14. Spending measures who received care, which depends on access, insurance, distance to a hospital,
time off work and whether a doctor believed the patient. Two equally sick people generate different
bills. The label therefore records who was treated rather than who was ill.

15. No. Every metric on the page compares the model's decisions to the recorded label, so if the
label is wrong the metrics measure agreement with a biased record rather than agreement with
reality. No threshold can repair a label. Fixing that requires changing what you measure, which is
what Obermeyer et al. did when they switched the target from cost to a direct measure of illness.
