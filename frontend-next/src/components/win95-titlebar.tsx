import type { ReactNode } from 'react';

interface Win95TitleBarProps {
  title: string;
  /** Optional element rendered before the window controls (e.g. a Back link) */
  right?: ReactNode;
  className?: string;
}

export function Win95TitleBar({ title, right, className }: Win95TitleBarProps) {
  return (
    <div
      className={`win95-titlebar -mx-4 -mt-4 mb-4 flex items-center justify-between gap-2 ${className ?? ''}`}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/titlebar-icon.png"
          alt=""
          width={14}
          height={14}
          className="shrink-0 [image-rendering:pixelated]"
        />
        <span className="text-sm truncate">{title}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {right}
        <span className="hidden sm:flex items-center gap-[2px]" aria-hidden="true">
          <span className="win95-titlebar-btn">–</span>
          <span className="win95-titlebar-btn">□</span>
          <span className="win95-titlebar-btn">✕</span>
        </span>
      </span>
    </div>
  );
}
