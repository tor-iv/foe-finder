'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  // Don't show navbar on auth pages
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (authPages.some((page) => pathname.startsWith(page))) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="win95-panel py-2 px-4 sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="font-display font-black text-lg md:text-xl">
            <span className="text-foe-accent">FOE</span>
            <span className="text-foreground">FINDER</span>
          </span>
          <span className="hidden md:inline text-xs text-muted-foreground ml-2">
            The Only Honest Dating App
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Welcome */}
              <span className="hidden lg:inline text-sm text-muted-foreground">
                Welcome, {user?.displayName}
              </span>

              {/* Profile Link */}
              <Link
                href="/profile"
                className={`win95-btn text-sm ${
                  pathname === '/profile' ? 'win95-pressed' : ''
                }`}
              >
                Profile
              </Link>

              {/* Admin Link (if admin) */}
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className={`win95-btn text-sm ${
                    pathname === '/admin' ? 'win95-pressed' : ''
                  }`}
                >
                  Admin
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={() => logout()}
                disabled={isLoading}
                className="win95-btn text-sm hover:bg-foe-error hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="win95-btn text-sm">
                Login
              </Link>
              <Link href="/register" className="win95-btn win95-btn-primary text-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
