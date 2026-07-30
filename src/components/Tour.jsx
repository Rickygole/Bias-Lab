import { useEffect, useRef } from 'react'
import { percent } from '../lib/format.js'

export const steps = [
  {
    body: (accuracy) =>
      `This model is ${accuracy === null ? 'about 84 percent' : percent(accuracy, 1)} accurate, and that number is real. Drag the threshold and watch it barely move. Then watch how many qualified people in each group get turned away.`,
  },
  {
    body: () =>
      'Try to make demographic parity zero. You can get close. Look at what equal opportunity does while you do it.',
  },
  {
    body: () =>
      'Now switch to separate thresholds. You can close every gap at once, and the app will tell you when you have. Read what it says, because how you got there is the lesson.',
  },
  {
    body: () =>
      'Watch the intervals while you do it. A gap marked not certain is one this test set is too small to measure, not one that has gone away. Fairness auditing runs into this constantly.',
  },
  {
    body: () =>
      'This is the impossibility result. When base rates differ, calibration and equalized odds cannot both hold. You are not choosing whether to be unfair. You are choosing who absorbs it.',
  },
]

export default function Tour({ step, accuracy, onStep, onClose }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const open = step !== null

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    ref.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [open])

  if (!open) return null

  const last = step === steps.length - 1

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label="Guided tour"
      className="flex flex-col gap-3 border-t border-edge bg-panel px-6 py-4 outline-none lg:flex-row lg:items-center lg:gap-8 lg:px-5"
    >
      <div className="flex shrink-0 items-center gap-3">
        <span className="label text-dim">
          Step <span className="num">{step + 1}</span> of <span className="num">{steps.length}</span>
        </span>
        <span className="flex gap-1" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className="h-[2px] w-4 transition-colors duration-200"
              style={{ background: i <= step ? 'var(--color-ink)' : 'var(--color-edge)' }}
            />
          ))}
        </span>
      </div>

      <p aria-live="polite" className="min-w-0 flex-1 leading-[21px]">
        {steps[step].body(accuracy)}
      </p>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="note rounded-[2px] px-2 py-2 text-dim transition-colors duration-150 hover:text-ink"
        >
          Dismiss
        </button>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => onStep(step - 1)}
            className="rounded-[3px] border border-edge px-4 py-2 text-muted transition-colors duration-150 hover:border-dim hover:text-ink"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => (last ? onClose() : onStep(step + 1))}
          className="rounded-[3px] border border-ink bg-ink px-4 py-2 text-bg transition-colors duration-150 hover:border-muted hover:bg-muted"
        >
          {last ? 'Done' : 'Next'}
        </button>
      </div>
    </section>
  )
}
