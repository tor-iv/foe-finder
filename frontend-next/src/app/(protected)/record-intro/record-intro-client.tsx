'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '@/lib/animations';

export default function RecordIntroClient() {
  const router = useRouter();

  const handleSkip = () => {
    router.push('/results');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <div className="win95-panel">
          <div className="win95-titlebar -mx-4 -mt-4 mb-4">
            <span className="text-sm">FOE FINDER - Audio Intro</span>
          </div>

          <div className="text-center space-y-6">
            <motion.div
              variants={scaleIn}
              className="text-6xl"
            >
              🎙️
            </motion.div>

            <h1 className="text-xl font-display font-bold">
              Record Your Audio Intro
            </h1>

            <p className="text-sm text-muted-foreground">
              Record a 20-second intro so your future nemesis can hear your voice.
              This feature is coming soon!
            </p>

            <div className="win95-inset p-4 text-left text-sm">
              <p className="font-bold mb-2">Suggested topics:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Your hottest take</li>
                <li>A hill you&apos;ll die on</li>
                <li>What makes you controversial</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSkip}
                className="win95-btn px-6 py-3"
              >
                Skip for Now
              </button>
              <button
                disabled
                className="win95-btn win95-btn-primary px-6 py-3 opacity-50 cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
