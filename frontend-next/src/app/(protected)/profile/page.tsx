'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="win95-panel"
        >
          <div className="win95-titlebar -mx-4 -mt-4 mb-6">
            <span className="text-sm">USER PROFILE</span>
          </div>

          {/* Avatar & Name */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 win95-outset flex items-center justify-center text-4xl">
              👤
            </div>
            <h1 className="text-2xl font-display font-bold">{user.displayName}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Status Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {/* Questionnaire Status */}
            <motion.div variants={staggerItem} className="win95-inset p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">Questionnaire</span>
                <span
                  className={`px-2 py-1 text-xs font-bold ${
                    user.hasCompletedQuestionnaire
                      ? 'bg-foe-success text-white'
                      : 'bg-foe-warning text-white'
                  }`}
                >
                  {user.hasCompletedQuestionnaire ? 'COMPLETED' : 'INCOMPLETE'}
                </span>
              </div>
            </motion.div>

            {/* Match Status */}
            <motion.div variants={staggerItem} className="win95-inset p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">Match Status</span>
                <span
                  className={`px-2 py-1 text-xs font-bold ${
                    user.isMatched
                      ? 'bg-foe-success text-white'
                      : 'bg-foe-accent text-white'
                  }`}
                >
                  {user.isMatched ? 'MATCHED' : 'SEARCHING'}
                </span>
              </div>
            </motion.div>

            {/* Email Verification */}
            <motion.div variants={staggerItem} className="win95-inset p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">Email</span>
                <span
                  className={`px-2 py-1 text-xs font-bold ${
                    user.emailVerified
                      ? 'bg-foe-success text-white'
                      : 'bg-foe-error text-white'
                  }`}
                >
                  {user.emailVerified ? 'VERIFIED' : 'UNVERIFIED'}
                </span>
              </div>
            </motion.div>

            {/* Member Since */}
            <motion.div variants={staggerItem} className="win95-inset p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">Member Since</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {!user.hasCompletedQuestionnaire && (
              <Link href="/questionnaire" className="win95-btn win95-btn-primary px-6 py-3">
                Take Quiz
              </Link>
            )}
            <Link href="/results" className="win95-btn px-6 py-3">
              View Results
            </Link>
            <button
              onClick={() => logout()}
              className="win95-btn px-6 py-3 hover:bg-foe-error hover:text-white"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
