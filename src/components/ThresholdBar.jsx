import ThresholdSlider from './ThresholdSlider.jsx'

export default function ThresholdBar({ thresholds, splitMode, groupNames, onThreshold }) {
  return (
    <div className="flex flex-col gap-2 border-t border-edge px-6 pt-3 pb-1 lg:hidden">
      {splitMode ? (
        <>
          <ThresholdSlider
            swatch
            value={thresholds[0]}
            onChange={(v) => onThreshold(0, v)}
            color="var(--color-groupA)"
            label={groupNames[0]}
          />
          <ThresholdSlider
            swatch
            value={thresholds[1]}
            onChange={(v) => onThreshold(1, v)}
            color="var(--color-groupB)"
            label={groupNames[1]}
          />
        </>
      ) : (
        <ThresholdSlider
          value={thresholds[0]}
          onChange={(v) => onThreshold(0, v)}
          color="var(--color-ink)"
          label="Threshold"
        />
      )}
    </div>
  )
}
