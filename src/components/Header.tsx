import React from 'react';
import { motion } from 'motion/react';
import { Moon, ShoppingBag, Sun, User as UserIcon } from 'lucide-react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  cartCount: number;
  cartJiggle: boolean;
  cartBtnRef: React.RefObject<HTMLButtonElement | null>;
  onOpenCart: () => void;
  user: User | null;
  onGoogleLogin: () => void;
  onOpenDashboard: () => void;
}

export function GoogleLogoIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export function Header({
  isDark,
  onToggleTheme,
  cartCount,
  cartJiggle,
  cartBtnRef,
  onOpenCart,
  user,
  onGoogleLogin,
  onOpenDashboard,
}: HeaderProps) {
  const logoSrc = isDark
    ? '/assets/aistudio/logo-dark.webp'
    : '/assets/aistudio/logo-light.webp';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/90 dark:border-white/10 bg-white/92 dark:bg-[#0D0D0E]/92 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto h-16 sm:h-[76px] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Left + Center Track: Logo + Nav Links framed by full-span animated top & bottom lines reaching up to Dark/Light button */}
        <div className="relative flex-1 min-w-0 h-12 sm:h-14 flex items-center justify-between gap-4 sm:gap-8">
          {/* Subtle static base lines spanning from logo left edge to right before Dark/Light toggle */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-[14%] h-[2px] rounded-full bg-[#3f3c39]/18 dark:bg-[#f5f1e6]/18"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-[76%] h-[2px] rounded-full bg-[#3f3c39]/18 dark:bg-[#f5f1e6]/18"
          />

          {/* Smooth Left-to-Right Looping Animated Top Line (Desktop & Mobile) */}
          <motion.div
            aria-hidden="true"
            initial={{ clipPath: 'inset(0% 100% 0% 0%)', opacity: 0.45 }}
            animate={{
              clipPath: [
                'inset(0% 100% 0% 0%)',
                'inset(0% 0% 0% 0%)',
                'inset(0% 0% 0% 0%)',
                'inset(0% 0% 0% 100%)',
              ],
              opacity: [0.5, 1, 1, 0.35],
            }}
            transition={{
              duration: 3.0,
              times: [0, 0.45, 0.72, 1],
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute left-0 right-0 top-[14%] h-[2px] rounded-full bg-[#3f3c39] dark:bg-[#f5f1e6]"
          />

          {/* Smooth Left-to-Right Looping Animated Bottom Line (Desktop & Mobile) */}
          <motion.div
            aria-hidden="true"
            initial={{ clipPath: 'inset(0% 100% 0% 0%)', opacity: 0.45 }}
            animate={{
              clipPath: [
                'inset(0% 100% 0% 0%)',
                'inset(0% 0% 0% 0%)',
                'inset(0% 0% 0% 0%)',
                'inset(0% 0% 0% 100%)',
              ],
              opacity: [0.5, 1, 1, 0.35],
            }}
            transition={{
              duration: 3.0,
              delay: 0.14,
              times: [0, 0.45, 0.72, 1],
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute left-0 right-0 top-[76%] h-[2px] rounded-full bg-[#3f3c39] dark:bg-[#f5f1e6]"
          />

          {/* Zone 1: Clean Borderless Brand Wordmark & Subtitle */}
          <a
            href="#top"
            className="relative z-10 flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white rounded-lg"
          >
            <span className="sr-only">Karachi Brasserie</span>
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 transition-transform duration-200 hover:scale-[1.03] mix-blend-multiply dark:mix-blend-normal">
              <img
                src={logoSrc}
                alt="Karachi Brasserie"
                style={{ clipPath: 'inset(20% 0% 25.5% 0%)' }}
                className="absolute inset-0 w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <img
                src={logoSrc}
                alt=""
                aria-hidden="true"
                style={{ clipPath: 'inset(80.5% 0% 6% 0%)' }}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          </a>

          {/* Zone 2: Clean Desktop Navigation Links positioned between the top & bottom architectural lines */}
          <nav className="relative z-10 hidden md:flex items-center gap-8 mx-auto text-sm lg:text-base font-display tracking-wider text-neutral-700 dark:text-neutral-200">
            <a
              href="#menu"
              className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-0.5"
            >
              Menu
            </a>
            <a
              href="#experience"
              className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-0.5"
            >
              Dine-In
            </a>
            <a
              href="#experience"
              className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-0.5"
            >
              Delivery
            </a>
            <a
              href="#contact"
              className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-0.5"
            >
              Visit Us
            </a>
          </nav>
        </div>

        {/* Zone 3: Theme Toggle, Account & Primary Cart Action */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-neutral-300 dark:border-white/15 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white flex items-center justify-center hover:border-neutral-500 dark:hover:border-white/40 transition-all cursor-pointer shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4 text-neutral-100" /> : <Moon className="w-4 h-4 text-neutral-900" />}
          </button>

          {user ? (
            <button
              type="button"
              onClick={onOpenDashboard}
              aria-label="Open customer dashboard"
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl border border-neutral-300 dark:border-white/15 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white flex items-center gap-1.5 sm:gap-2 text-xs font-semibold hover:border-neutral-500 dark:hover:border-white/40 transition-all cursor-pointer shrink-0"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Customer'}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-4 h-4 shrink-0" />
              )}
              <span className="hidden sm:inline max-w-[90px] truncate">
                {user.displayName?.split(' ')[0] || 'Account'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoogleLogin}
              aria-label="Sign in with Google"
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white flex items-center gap-1.5 text-xs font-semibold hover:border-neutral-500 dark:hover:border-white/40 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <GoogleLogoIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          <button
            ref={cartBtnRef}
            type="button"
            onClick={onOpenCart}
            aria-label={`Open cart with ${cartCount} items`}
            className={`relative h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center gap-1 sm:gap-2 text-xs font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              cartJiggle ? 'animate-cart-jiggle ring-4 ring-neutral-900/25 dark:ring-white/35' : ''
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Cart</span>
            <span className="font-mono-num inline-flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 sm:px-1.5 rounded-md bg-white/20 dark:bg-black/15 text-[10px] sm:text-[11px] font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
