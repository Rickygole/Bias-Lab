import { useEffect, useRef } from 'react'

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
  const cardRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const open = step !== null

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    cardRef.current?.focus()
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

  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center px-6 pb-28">
      <div
        ref={cardRef}
        role="dialog"
        aria-label="Guided tour"
        tabIndex={-1}
        className="pointer-events-auto w-full max-w-xl rounded-md border border-edge bg-panel p-6 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
      >
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <span className="label">
            Step <span className="num">{step + 1}</span> of{' '}
            <span className="num">{steps.length}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[2px] text-[11px] text-muted transition-colors duration-150 hover:text-ink"
          >
            Dismiss
          </button>
        </div>

        <p aria-live="polite" className="leading-relaxed">
          {current.body}
        </p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-2" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className="h-[2px] w-6 rounded-full transition-colors duration-200"
                style={{ background: i <= step ? 'var(--color-ink)' : 'var(--color-edge)' }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => onStep(step - 1)}
                className="rounded-[4px] border border-edge px-4 py-2 text-muted transition-colors duration-150 hover:text-ink"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (last ? onClose() : onStep(step + 1))}
              className="rounded-[4px] border border-edge bg-edge px-4 py-2 transition-colors duration-150 hover:border-muted"
            >
              {last ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
