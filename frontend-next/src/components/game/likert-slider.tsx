'use client';

interface LikertSliderProps {
  value: number;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
}

export function LikertSlider({
  value,
  onChange,
  minLabel = 'Strongly Disagree',
  maxLabel = 'Strongly Agree',
  disabled,
}: LikertSliderProps) {
  return (
    <div className="bg-win95-shadow/30 border-2 border-win95-darkShadow p-3">
      <div className="flex justify-between gap-2 mb-3">
        <span className="text-[9px] font-bold uppercase tracking-wide bg-win95-face px-1 py-1 border-2 border-win95-darkShadow text-center">
          {minLabel}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide bg-win95-face px-1 py-1 border-2 border-win95-darkShadow text-center">
          {maxLabel}
        </span>
      </div>

      <div className="relative h-[36px]">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[10px] border-2 border-win95-darkShadow bg-win95-face">
          <div
            className="absolute left-0 top-0 bottom-0 bg-foe-accent origin-left"
            style={{ width: '100%', transform: `scaleX(${(value - 1) / 6})` }}
          />
        </div>
        <div
          className="absolute w-6 h-6 bg-foe-accent border-2 border-win95-darkShadow pointer-events-none"
          style={{
            top: '50%',
            left: `${((value - 1) / 6) * 100}%`,
            transform: 'translateX(-50%) translateY(-50%)',
          }}
        />
        <input
          type="range"
          min={1}
          max={7}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full cursor-pointer"
          style={{ opacity: 0.0001, WebkitAppearance: 'none' }}
          aria-label="Rate from 1 to 7"
        />
      </div>
    </div>
  );
}
