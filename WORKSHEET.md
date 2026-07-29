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

10. Try to get **all** of the live gaps under 5 percent at the same time. Write down the two
    thresholds you used, and then write down what share of each group you ended up approving.

11. Now try it again with one extra rule: you must approve at least a quarter of each group. Record
    the closest you got and which definition refused to cooperate.

12. Read the note under the fairness table about calibration. Why does calibration not move when you
    drag the slider? What does that tell you about the difference between a score and a decision?

## Part 4. Uncertainty

13. Find a gap marked **not certain**. What does that label mean? Is the gap zero?

14. Look at the group sizes in the outcomes panel on any dataset. One group is much smaller than the
    other. What does that do to the intervals on that group's rates, and why?

## Part 5. The label

15. Open the dataset card for **Medical risk** and read it. The label is defined by healthcare
    spending. What is wrong with using spending as a measure of who is sick?

16. Suppose you fixed the threshold perfectly, so that every fairness gap on screen was zero. Would
    the tool now be fair to the patients in that data? Explain your answer in two sentences.

---

## Discussion questions

- Setting a different threshold for each group is illegal in some contexts and required for fairness
  in others. Which contexts, and why do you think the law lands differently in each?
- Who should decide which definition of fairness a deployed system optimises for? The engineer, the
  company, the regulator, or the people affected?
- Question 16 is the one that matters. A model can pass every metric on this page and still be built
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

10. They will manage it, and that is the point of the question. On Medical risk, separate thresholds
at 0.72 and 0.67 put every live gap under 5 percent. Look at what it cost: 10.0 percent of White
patients and 5.2 percent of Black patients were flagged, so almost everyone who needed care was
turned away. The app says so directly when you get there. Equality achieved by giving nobody
anything is the cheapest kind, and it is the most common way a real system passes a fairness audit
while helping no one.

11. Now they will not manage it. Once each group must receive at least a quarter of the decisions,
the best achievable worst gap is roughly 8 to 10 points depending on the dataset. `data/audit.py`
computes this over the whole threshold grid under a stated 10 percent floor.

12. Calibration is a property of the scores the model produces, and the threshold only decides where
to cut those scores. Changing where you cut does not change what a score of 0.7 means. A score is a
statement about probability. A decision is a policy applied to that statement, and only the policy
is yours to move.

13. It means the confidence interval on the gap crosses zero, so this test set is too small to
distinguish that gap from no gap. It does not mean the gap is zero. It means you do not know.

14. Every rate for the smaller group is estimated from fewer people, so its interval is wider and its
gaps are more often marked not certain. On the loan data the smaller group has 436 people and only
47 of them would repay, so the true positive rate rests on 47 cases and one person crossing the line
moves it by more than two points.

15. Spending measures who received care, which depends on access, insurance, distance to a hospital,
time off work and whether a doctor believed the patient. Two equally sick people generate different
bills. The label therefore records who was treated rather than who was ill.

16. No. Every metric on the page compares the model's decisions to the recorded label, so if the
label is wrong the metrics measure agreement with a biased record rather than agreement with
reality. No threshold can repair a label. Fixing that requires changing what you measure, which is
what Obermeyer et al. did when they switched the target from cost to a direct measure of illness.
