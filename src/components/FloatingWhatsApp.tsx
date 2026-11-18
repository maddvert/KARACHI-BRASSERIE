import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ExternalLink, MessageCircle, PackageCheck, Send, X } from 'lucide-react';
import { RESTAURANT_COORDS } from '../data/karachiAreas';
import { WhatsAppIcon } from './ExperienceAndFooter';

interface FloatingWhatsAppProps {
  /** Triggers an automatic 3-second Wait Time tooltip expansion on mount */
  autoExpandWaitTime?: boolean;
  activeOrderId?: string | null;
  onOpenOrderTracking?: () => void;
}

interface WaitTimeInfo {
  windowLabel: string;
  waitRange: string;
  note: string;
}

function getDynamicWaitTime(hour: number): WaitTimeInfo {
  if (hour >= 19 && hour <= 22) {
    return {
      windowLabel: 'Dinner Peak',
      waitRange: '30–40 mins',
      note: 'High kitchen volume at Saddar',
    };
  }
  if (hour >= 12 && hour <= 15) {
    return {
      windowLabel: 'Lunch Service',
      waitRange: '20–25 mins',
      note: 'Freshly fired to order',
    };
  }
  if (hour >= 16 && hour <= 18) {
    return {
      windowLabel: 'Afternoon Hours',
      waitRange: '15–20 mins',
      note: 'Fastest kitchen turnaround',
    };
  }
  if (hour === 23) {
    return {
      windowLabel: 'Late Evening',
      waitRange: '20–25 mins',
      note: 'Serving until 12:00 AM',
    };
  }
  return {
    windowLabel: 'Pre-Open',
    waitRange: '~20 mins prep',
    note: 'Kitchen opens daily at 12:00 PM',
  };
}

/** Builds a tiny, clean 140ms PCM WAV "notification pop" chime as a Blob URL for Audio() */
function createPopAudioUrl(): string {
  const sampleRate = 22050;
  const durationSec = 0.14;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate;
    const freq = 580 + t * 2400; // Subtle upward pop sweep
    const envelope = Math.exp(-t * 28) * Math.min(1, t / 0.008);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.28 * envelope;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

interface QueryTemplate {
  id: string;
  label: string;
  message: string;
  isTracking?: boolean;
}

export function FloatingWhatsApp({
  autoExpandWaitTime = true,
  activeOrderId,
  onOpenOrderTracking,
}: FloatingWhatsAppProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [autoWaitExpanded, setAutoWaitExpanded] = useState(autoExpandWaitTime);
  const [showNeedHelp, setShowNeedHelp] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());

  const popAudioRef = useRef<HTMLAudioElement | null>(null);
  const popAudioUrlRef = useRef<string | null>(null);

  // Refresh dynamic hourly wait-time every minute
  useEffect(() => {
    const interval = window.setInterval(() => {
      setHour(new Date().getHours());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // Preload Audio object on mount + manage 3-second Wait Time expansion & 3-second 'Need help?' greeting
  useEffect(() => {
    let audioUrl = '';
    try {
      audioUrl = createPopAudioUrl();
      popAudioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audio.volume = 0.28;
      audio.preload = 'auto';
      popAudioRef.current = audio;
    } catch {
      // Ignore audio initialization errors in restricted environments
    }

    let autoTooltipTimer: number | undefined;
    if (autoExpandWaitTime) {
      setAutoWaitExpanded(true);
      autoTooltipTimer = window.setTimeout(() => {
        setAutoWaitExpanded(false);
      }, 3000);
    }

    let hideGreetingTimer: number | undefined;
    const showGreetingTimer = window.setTimeout(() => {
      setShowNeedHelp(true);
      if (popAudioRef.current) {
        popAudioRef.current.currentTime = 0;
        popAudioRef.current.play().catch(() => {
          // Browser autoplay policy may block audio before first user gesture
        });
      }
      hideGreetingTimer = window.setTimeout(() => {
        setShowNeedHelp(false);
      }, 6500);
    }, 3000);

    return () => {
      if (autoTooltipTimer) window.clearTimeout(autoTooltipTimer);
      window.clearTimeout(showGreetingTimer);
      if (hideGreetingTimer) window.clearTimeout(hideGreetingTimer);
      if (popAudioUrlRef.current) {
        URL.revokeObjectURL(popAudioUrlRef.current);
      }
    };
  }, [autoExpandWaitTime]);

  const waitTime = useMemo(() => getDynamicWaitTime(hour), [hour]);

  const templates: QueryTemplate[] = useMemo(
    () => [
      {
        id: 'track-order',
        label: 'How to track my order',
        isTracking: true,
        message: activeOrderId
          ? `Hello Karachi Brasserie! How can I track my order #${activeOrderId}?`
          : 'Hello Karachi Brasserie! How to track my order status and estimated arrival?',
      },
      {
        id: 'wait-time',
        label: `Current wait time (${waitTime.waitRange})`,
        message: `Hello Karachi Brasserie! What is the current wait time and today's running deals?`,
      },
      {
        id: 'place-order',
        label: 'Order & delivery enquiry',
        message: 'Hello Karachi Brasserie! I would like to place a delivery order from Saddar.',
      },
      {
        id: 'book-table',
        label: 'Reserve a dine-in table',
        message: 'Hello Karachi Brasserie! I would like to book a table at Hotel Excelsior, Saddar.',
      },
    ],
    [activeOrderId, waitTime.waitRange]
  );

  const showWaitTooltip = !menuOpen && (hovered || autoWaitExpanded);

  const openWhatsAppWithText = (text: string) => {
    const url = `https://wa.me/${RESTAURANT_COORDS.whatsappE164}?text=${encodeURIComponent(text)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div
      className="fixed left-3.5 bottom-3.5 sm:left-6 sm:bottom-6 z-40 mb-14 md:mb-0 flex flex-col items-start gap-2.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glassmorphism Template Query Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            className="w-72 sm:w-80 rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-white/82 dark:bg-[#141416]/82 backdrop-blur-xl text-neutral-950 dark:text-white shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-neutral-200/70 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Karachi Brasserie Support</p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
                    Wait Time: <span className="font-semibold">{waitTime.waitRange}</span> ·{' '}
                    {waitTime.windowLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close WhatsApp quick menu"
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
                Quick Query Templates
              </p>

              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    if (tpl.isTracking && activeOrderId && onOpenOrderTracking) {
                      setMenuOpen(false);
                      onOpenOrderTracking();
                      return;
                    }
                    openWhatsAppWithText(tpl.message);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-neutral-200/75 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-neutral-950 transition-colors flex items-center justify-between gap-2 text-xs font-medium cursor-pointer group"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {tpl.isTracking ? (
                      <PackageCheck className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    ) : (
                      <MessageCircle className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    )}
                    <span className="truncate">{tpl.label}</span>
                  </span>
                  <Send className="w-3 h-3 shrink-0 opacity-60 group-hover:opacity-100" />
                </button>
              ))}

              <a
                href={`https://wa.me/${RESTAURANT_COORDS.whatsappE164}?text=${encodeURIComponent(
                  'Hello Karachi Brasserie! I would like to place an order or ask a question.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-full py-2.5 px-3 rounded-xl bg-[#1F9D55] hover:bg-[#198748] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Start Direct WhatsApp Chat</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Hourly Wait Time Tooltip (Hover + Auto 3s Mount Expansion) */}
      <AnimatePresence>
        {showWaitTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
            className="px-3 py-2 rounded-xl border border-neutral-200/80 dark:border-white/15 bg-white/90 dark:bg-[#161618]/90 text-neutral-950 dark:text-white shadow-lg text-xs max-w-[240px]"
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#1F9D55] shrink-0" />
              <span>Wait Time: {waitTime.waitRange}</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5">
              {waitTime.windowLabel} · {waitTime.note}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Contact Trigger + Temporary 3-Second Slide-In 'Need help?' Greeting */}
      <div className="flex items-center gap-2.5">
        <motion.button
          type="button"
          onClick={() => {
            setShowNeedHelp(false);
            setAutoWaitExpanded(false);
            setMenuOpen((prev) => !prev);
          }}
          aria-label="Message Karachi Brasserie on WhatsApp"
          aria-expanded={menuOpen}
          initial={{ opacity: 0, scale: 0.7, x: -20 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: menuOpen ? 0 : [0, -5, 0],
          }}
          transition={{
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 },
            x: { duration: 0.4 },
            y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative group flex items-center gap-2 p-3.5 sm:px-4 sm:py-3 rounded-full bg-[#1F9D55] hover:bg-[#198748] text-white text-xs sm:text-sm font-semibold shadow-xl shadow-black/30 cursor-pointer"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none"
            style={{ animationDuration: '2.8s' }}
          />
          <WhatsAppIcon className="relative z-10 w-6 h-6 sm:w-5 sm:h-5" />
          <span className="relative z-10 hidden sm:inline">WhatsApp</span>
        </motion.button>

        {/* Slide-In 'Need help?' Greeting Text 3 seconds after load */}
        <AnimatePresence>
          {showNeedHelp && !menuOpen && (
            <motion.button
              type="button"
              onClick={() => {
                setShowNeedHelp(false);
                setMenuOpen(true);
              }}
              initial={{ opacity: 0, x: -14, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -12, scale: 0.92 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              className="px-3.5 py-2 rounded-full border border-neutral-200/80 dark:border-white/15 bg-white/90 dark:bg-[#161618]/90 text-neutral-950 dark:text-white text-xs font-semibold shadow-lg whitespace-nowrap cursor-pointer hover:border-[#1F9D55] transition-colors"
            >
              Need help?
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
