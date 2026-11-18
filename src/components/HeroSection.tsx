import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, MapPin, Plus, ChevronRight } from 'lucide-react';
import { MENU_ITEMS, MenuItem, formatRs } from '../data/menuData';
import type { KarachiArea } from '../data/karachiAreas';
import type { OrderType } from '../types/order';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface HeroSectionProps {
  isDark: boolean;
  orderType: OrderType;
  selectedArea: KarachiArea;
  cartItemIds?: Set<string>;
  onOpenLocationModal: () => void;
  onQuickAdd: (item: MenuItem, imgEl: HTMLImageElement | null) => void;
}

const SLIDE_ITEMS = MENU_ITEMS.filter((item) => item.featured);

const HERO_SLIDE_IMAGES = [
  {
    src: '/assets/aistudio/hero-slide-1.webp',
    alt: 'Karachi Brasserie Dining Lounge',
  },
  {
    src: '/assets/aistudio/hero-slide-2.webp',
    alt: 'Karachi Brasserie Espresso & Mocktail Bar',
  },
  {
    src: '/assets/aistudio/hero-slide-3.webp',
    alt: 'Karachi Brasserie Architectural Staircase Dining',
  },
  {
    src: '/assets/aistudio/hero-slide-4.webp',
    alt: 'Karachi Brasserie Evening Window Seating',
  },
  {
    src: '/assets/aistudio/hero-slide-5.webp',
    alt: 'Karachi Brasserie Saddar Storefront',
  },
];

export function HeroSection({
  isDark,
  orderType,
  selectedArea,
  cartItemIds,
  onOpenLocationModal,
  onQuickAdd,
}: HeroSectionProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [bgSlideIndex, setBgSlideIndex] = useState(0);

  // Continuous 3-second looping Hero Background Image Slider + Featured Dish Showcase
  useEffect(() => {
    const interval = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDE_ITEMS.length);
      setBgSlideIndex((prev) => (prev + 1) % HERO_SLIDE_IMAGES.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  const currentSlide = SLIDE_ITEMS[slideIndex] ?? MENU_ITEMS[0];
  const currentHeroPhoto = HERO_SLIDE_IMAGES[bgSlideIndex] ?? HERO_SLIDE_IMAGES[0];
  const isSlideAdded = cartItemIds?.has(currentSlide.id) ?? false;

  const orderModeLabel =
    orderType === 'delivery'
      ? `Delivery · ${selectedArea.name}`
      : orderType === 'takeaway'
      ? 'Takeaway · Hotel Excelsior, Saddar'
      : 'Dine-In · Hotel Excelsior, Saddar';

  return (
    <section
      id="top"
      className="relative w-full min-h-[76vh] sm:min-h-[82vh] lg:min-h-[86vh] flex flex-col justify-between overflow-hidden border-b border-neutral-200 dark:border-white/10"
    >
      {/* Full-width Large Hero 3-Second Sliding Ambiance Photography Layer with Skeleton Fallback */}
      <div className="absolute inset-0 overflow-hidden bg-neutral-200 dark:bg-neutral-900">
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-800/80"
        />
        <AnimatePresence initial={false} mode="sync">
          <motion.img
            key={currentHeroPhoto.src}
            src={currentHeroPhoto.src}
            alt={currentHeroPhoto.alt}
            loading={bgSlideIndex === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={bgSlideIndex === 0 ? 'high' : 'auto'}
            initial={{ opacity: 0, x: '8%', scale: 1.04 }}
            animate={{ opacity: 1, x: '0%', scale: 1 }}
            exit={{ opacity: 0, x: '-8%' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Measured Monochrome Contrast Scrim allowing full hero image depth while ensuring >= 4.5:1 legibility */}
        <div
          className={
            isDark
              ? 'absolute inset-0 bg-gradient-to-r from-[#0B0B0C]/90 via-[#111113]/68 to-black/35'
              : 'absolute inset-0 bg-gradient-to-r from-white/92 via-neutral-100/72 to-white/30'
          }
        />
      </div>

      {/* Main Centered Hero Content */}
      <div className="relative z-10 flex-1 flex items-center w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Editorial Column with Staggered Fade-In-Up Entrance */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                <span>Hotel Excelsior, Opposite Atrium Mall, Saddar</span>
                <span aria-hidden="true">·</span>
                <span>Daily 12:00 PM – 12:00 AM</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{ textWrap: 'balance' }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.04] text-neutral-950 dark:text-white"
              >
                Crafted All-Day Dining in the Heart of Saddar
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-neutral-700 dark:text-neutral-200"
              >
                From sizzling smash burgers, wood-fired pizzas, and focaccia sandwiches to specialty
                espresso, gelato shakes, and hand-crafted desserts — prepared fresh for dine-in,
                takeaway, or doorstep delivery across Karachi.
              </motion.p>

              {/* Primary CTA + Location / Order Mode Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1"
              >
                <a
                  href="#menu"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold shadow-lg hover:opacity-90 transition-all whitespace-nowrap"
                >
                  <span>Explore Full Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={onOpenLocationModal}
                  className="inline-flex items-center justify-between sm:justify-start gap-2.5 px-4 py-3.5 rounded-xl border border-neutral-300 dark:border-white/20 bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm font-medium hover:border-neutral-600 dark:hover:border-white/50 transition-all cursor-pointer min-w-0"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-neutral-900 dark:text-white shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-[230px]">{orderModeLabel}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                </button>
              </motion.div>
            </div>

            {/* Right Continuous 3-Second Looping Menu Showcase Slider */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5"
            >
              <div className="rounded-2xl border border-neutral-200 dark:border-white/15 bg-white/95 dark:bg-[#161618]/94 backdrop-blur-md p-4 sm:p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Featured Dish Showcase
                  </span>
                  <div className="flex items-center gap-1">
                    {SLIDE_ITEMS.slice(0, 6).map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={`View ${item.name}`}
                        onClick={() => setSlideIndex(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          slideIndex % 6 === idx
                            ? 'w-5 bg-neutral-950 dark:bg-white'
                            : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide.id}
                    initial={{ opacity: 0, x: 24, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -24, scale: 0.98 }}
                    transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-12 gap-4 items-center"
                  >
                    <div className="col-span-5 aspect-square rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                      <ImageWithSkeleton
                        id={`hero-slide-img-${currentSlide.id}`}
                        src={currentSlide.image}
                        alt={currentSlide.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="col-span-7 flex flex-col justify-between space-y-2.5 min-w-0">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          {currentSlide.categoryLabel}
                        </p>
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-neutral-950 dark:text-white leading-tight truncate">
                          {currentSlide.name}
                        </h3>
                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                          {currentSlide.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 min-w-0">
                        <span className="font-mono-num text-sm sm:text-base font-bold text-neutral-950 dark:text-white whitespace-nowrap shrink-0">
                          {formatRs(currentSlide.price)}
                        </span>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const el = document.getElementById(
                              `hero-slide-img-${currentSlide.id}`
                            ) as HTMLImageElement | null;
                            onQuickAdd(currentSlide, el);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            isSlideAdded
                              ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                              : 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90'
                          }`}
                        >
                          {isSlideAdded ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Plus className="w-3.5 h-3.5 shrink-0" />}
                          <span>{isSlideAdded ? 'Added' : 'Add'}</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hero Background Slide Indicators */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-4 flex items-center justify-center sm:justify-start gap-2">
        {HERO_SLIDE_IMAGES.map((photo, idx) => (
          <button
            key={photo.src}
            type="button"
            aria-label={`View hero photo ${idx + 1}: ${photo.alt}`}
            onClick={() => setBgSlideIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              bgSlideIndex === idx
                ? 'w-7 bg-neutral-950 dark:bg-white'
                : 'w-2 bg-neutral-950/30 dark:bg-white/35 hover:bg-neutral-950/60 dark:hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Signature Marble Chevron / Zigzag Strip */}
      <div className="kb-chevron-strip relative z-10" aria-hidden="true" />
    </section>
  );
}
