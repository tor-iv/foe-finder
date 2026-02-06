'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

// Target date: National Enemy Day 2026 at midnight (local time)
const TARGET_DATE = new Date('2026-06-09T00:00:00');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft | null {
  const now = new Date().getTime();
  const target = TARGET_DATE.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

function padZero(value: number): string {
  return value.toString().padStart(2, '0');
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateCountdown = () => {
      const time = calculateTimeLeft();
      if (time === null) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft(time);
      }
    };

    // Initial calculation
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || !timeLeft) {
    return (
      <div className="win95-panel">
        <div className="win95-titlebar -mx-4 -mt-4 mb-4">
          <span className="text-sm">NEMESIS REVEAL</span>
        </div>
        <div className="h-24 flex items-center justify-center">
          <span className="font-mono text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={fadeInUp} className="win95-panel">
      <div className="win95-titlebar -mx-4 -mt-4 mb-4 flex items-center justify-between">
        <span className="text-sm">NEMESIS REVEAL</span>
        <span className="text-xs opacity-70">June 9 • National Enemy Day</span>
      </div>

      {isExpired ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-4"
        >
          <div className="text-4xl mb-2">🎯</div>
          <p className="font-display font-bold text-lg text-foe-accent uppercase">
            Matching Complete
          </p>
          <p className="text-sm text-muted-foreground">Find your nemesis now!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Countdown Grid */}
          <div className="flex justify-center items-center gap-2 md:gap-3">
            <TimeUnit value={timeLeft.days} label="DAYS" />
            <Separator />
            <TimeUnit value={timeLeft.hours} label="HRS" />
            <Separator />
            <TimeUnit value={timeLeft.minutes} label="MIN" />
            <Separator />
            <TimeUnit value={timeLeft.seconds} label="SEC" />
          </div>

          {/* Tagline */}
          <p className="text-center text-xs text-muted-foreground font-mono">
            Your nemesis awaits.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="win95-inset px-3 py-2 md:px-4 md:py-3 min-w-[50px] md:min-w-[60px]">
        <span className="font-display font-black text-xl md:text-2xl text-foe-accent block text-center">
          {padZero(value)}
        </span>
      </div>
      <span className="text-[10px] md:text-xs font-bold text-muted-foreground mt-1 tracking-wide">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span className="font-display font-black text-xl md:text-2xl text-foreground pb-5">
      :
    </span>
  );
}
