'use client';

import { useEffect, useRef } from 'react';

interface LikertSliderProps {
  value: number;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
}

/**
 * Win95-styled 1-7 slider. Uncontrolled while dragging: visuals are painted
 * directly via refs on every `input` event (no React re-render), and `onChange`
 * fires only on the native `change` event — i.e. when the pointer is released
 * (or per keystroke for keyboard users). This keeps big parent pages from
 * re-rendering on every pixel of a drag.
 */
export function LikertSlider({
  value,
  onChange,
  minLabel = 'Strongly Disagree',
  maxLabel = 'Strongly Agree',
  disabled,
}: LikertSliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const paint = (v: number) => {
    const frac = (v - 1) / 6;
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${frac})`;
    if (thumbRef.current) thumbRef.current.style.left = `calc(${frac * 100}% * 0.94 + 3%)`;
  };

  // Sync visuals + DOM value when the committed value changes from outside
  // (e.g. the form resets after submitting a guess).
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = String(value);
    paint(value);
  }, [value]);

  // Commit on the native `change` event only — it fires on release, unlike
  // React's onChange which (for ranges) fires continuously like `input`.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const commit = () => onChangeRef.current(Number(el.value));
    el.addEventListener('change', commit);
    return () => el.removeEventListener('change', commit);
  }, []);

  return (
    <div className="win95-inset p-3">
      <div className="relative h-[36px]">
        {/* Channel */}
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-[8px] win95-inset !bg-white">
          <div
            ref={fillRef}
            className="absolute left-0 top-0 bottom-0 bg-foe-accent origin-left"
            style={{ width: '100%', transform: `scaleX(${(value - 1) / 6})` }}
          />
        </div>

        {/* Tick marks, one per step */}
        <div className="absolute inset-x-1 top-[29px] flex justify-between px-[2px]" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="w-[2px] h-[5px] bg-win95-dark-shadow" />
          ))}
        </div>

        <input
          ref={inputRef}
          type="range"
          min={1}
          max={7}
          step={1}
          defaultValue={value}
          disabled={disabled}
          onInput={(e) => paint(Number(e.currentTarget.value))}
          className="peer absolute inset-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
          style={{ opacity: 0.0001, WebkitAppearance: 'none', touchAction: 'manipulation' }}
          aria-label="Rate from 1 to 7"
        />

        {/* Bevelled thumb (decorative — the real input is the invisible range above) */}
        <div
          ref={thumbRef}
          className="absolute w-[18px] h-[30px] win95-outset border border-win95-dark-shadow pointer-events-none will-change-transform peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-dotted peer-focus-visible:outline-offset-[-4px]"
          style={{
            top: '46%',
            left: `calc(${((value - 1) / 6) * 100}% * 0.94 + 3%)`,
            transform: 'translateX(-50%) translateY(-50%)',
          }}
        >
          <span className="absolute inset-x-[5px] top-[7px] space-y-[3px]" aria-hidden="true">
            <span className="block h-[1px] bg-win95-shadow" />
            <span className="block h-[1px] bg-win95-shadow" />
            <span className="block h-[1px] bg-win95-shadow" />
          </span>
        </div>
      </div>

      <div className="flex justify-between gap-2 mt-2">
        <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          {minLabel}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground text-right">
          {maxLabel}
        </span>
      </div>
    </div>
  );
}
