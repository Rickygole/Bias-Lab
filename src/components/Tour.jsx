export const steps = [
  {
    body: 'This model is about 82 percent accurate. That number is real. Watch what it hides.',
    needs: 'trained',
  },
  {
    body: 'Drag the threshold. Watch the overall accuracy at the bottom. Now watch how many qualified people in each group get denied.',
    needs: 'trained',
  },
  {
    body: 'Try to make demographic parity zero. You can get close. Look at what equal opportunity does while you do it.',
    needs: 'trained',
  },
  {
    body: 'Now switch to separate thresholds. You can equalize one definition exactly. You still cannot equalize them all.',
    needs: 'trained',
  },
  {
    body: 'This is the impossibility result. When base rates differ, calibration and equalized odds cannot both hold. You are not choosing whether to be unfair. You are choosing who absorbs it.',
    needs: 'trained',
  },
]

export default function Tour({ step, onStep, onClose }) {
  if (step === null) return null
  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-6">
      <div className="pointer-events-auto w-full max-w-xl rounded-md border border-edge bg-panel p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">
            Step {step + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-muted hover:text-ink"
          >
            Dismiss
          </button>
        </div>

        <p className="text-[15px] leading-relaxed">{current.body}</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-[6px]">
            {steps.map((_, i) => (
              <span
                key={i}
                className="h-[3px] w-6 rounded-full transition-colors duration-200"
                style={{ background: i <= step ? 'var(--color-ink)' : 'var(--color-edge)' }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => onStep(step - 1)}
                className="rounded-[4px] border border-edge px-3 py-[6px] text-[12px] text-muted hover:text-ink"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (last ? onClose() : onStep(step + 1))}
              className="rounded-[4px] border border-edge bg-edge px-4 py-[6px] text-[12px]"
            >
              {last ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
