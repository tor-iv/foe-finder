import { Win95TitleBar } from '@/components/win95-titlebar';

/** Full-screen Win95-chrome loading state: a small window with a marching progress bar. */
export function Win95Loading({ title = 'FOE FINDER', label = 'Loading...' }: { title?: string; label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="win95-panel w-full max-w-xs">
        <Win95TitleBar title={title} />
        <p className="text-sm mb-3">{label}</p>
        <div className="win95-inset h-[18px] p-[3px] overflow-hidden">
          <div className="win95-progress-blocks h-full" />
        </div>
      </div>
    </div>
  );
}
