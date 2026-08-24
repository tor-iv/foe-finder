'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

interface Stats {
  totalUsers: number;
  completedQuestionnaire: number;
  totalMatches: number;
  matchedUsers: number;
  unmatchedCompleted: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/admin/match');
    if (res.ok) {
      setStats(await res.json());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/admin/match');
      if (res.ok && !cancelled) {
        setStats(await res.json());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runMatching = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/match', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Matching failed');
        return;
      }
      setResult(
        `${data.created} new match${data.created === 1 ? '' : 'es'} created.` +
          (data.stillSearching ? ` ${data.stillSearching} user(s) still searching.` : '')
      );
      await loadStats();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-xl mx-auto">
        <motion.div initial="initial" animate="animate" variants={fadeInUp} className="win95-panel">
          <div className="win95-titlebar -mx-4 -mt-4 mb-6">
            <span className="text-sm">ADMIN — MATCHING CONTROL</span>
          </div>

          {stats && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3 mb-6"
            >
              <motion.div variants={staggerItem} className="win95-inset p-4 flex justify-between">
                <span className="font-bold uppercase text-sm">Total Users</span>
                <span className="font-mono">{stats.totalUsers}</span>
              </motion.div>
              <motion.div variants={staggerItem} className="win95-inset p-4 flex justify-between">
                <span className="font-bold uppercase text-sm">Completed Quiz</span>
                <span className="font-mono">{stats.completedQuestionnaire}</span>
              </motion.div>
              <motion.div variants={staggerItem} className="win95-inset p-4 flex justify-between">
                <span className="font-bold uppercase text-sm">Matched Users</span>
                <span className="font-mono">{stats.matchedUsers}</span>
              </motion.div>
              <motion.div variants={staggerItem} className="win95-inset p-4 flex justify-between">
                <span className="font-bold uppercase text-sm">Total Matches</span>
                <span className="font-mono">{stats.totalMatches}</span>
              </motion.div>
              <motion.div variants={staggerItem} className="win95-inset p-4 flex justify-between">
                <span className="font-bold uppercase text-sm">Waiting To Be Matched</span>
                <span className="font-mono">{stats.unmatchedCompleted}</span>
              </motion.div>
            </motion.div>
          )}

          <button
            onClick={runMatching}
            disabled={isRunning}
            className="win95-btn win95-btn-primary w-full py-3"
          >
            {isRunning ? 'Running Matching...' : 'Run Matching'}
          </button>

          {result && <div className="win95-inset p-3 mt-4 text-sm">{result}</div>}
          {error && <div className="win95-inset p-3 mt-4 text-sm text-foe-error">{error}</div>}

          <p className="text-xs text-muted-foreground mt-4">
            Only pairs users who completed the questionnaire and aren&apos;t already matched.
            Safe to run repeatedly.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
