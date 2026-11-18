import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Mic,
  MicOff,
  Plus,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import {
  MENU_CATEGORIES,
  MENU_ITEMS,
  MenuCategoryId,
  MenuItem,
  formatRs,
} from '../data/menuData';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface MenuSectionProps {
  favoriteIds: Set<string>;
  cartQtyByKey: Map<string, number>;
  onToggleFavorite: (item: MenuItem) => void;
  onAddToCart: (
    item: MenuItem,
    imgEl: HTMLImageElement | null,
    variantLabel?: string,
    overridePrice?: number,
    flavorAddon?: string
  ) => void;
}

const COFFEE_FLAVORS = ['Vanilla', 'Hazelnut', 'Caramel', 'Irish'];
const VISIBLE_CATEGORIES = MENU_CATEGORIES.filter((c) => c.id !== 'all');

function MenuCard({
  item,
  isFavorite,
  cartQtyByKey,
  onToggleFavorite,
  onAddToCart,
}: {
  item: MenuItem;
  isFavorite: boolean;
  cartQtyByKey: Map<string, number>;
  onToggleFavorite: (item: MenuItem) => void;
  onAddToCart: MenuSectionProps['onAddToCart'];
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [tapPulseKey, setTapPulseKey] = useState(0);

  const activeVariant = item.variants?.[selectedVariantIdx];
  const basePrice = activeVariant ? activeVariant.price : item.price;
  const finalPrice = basePrice + (selectedFlavor ? 250 : 0);

  const cartKey = `${item.id}__${activeVariant?.label || 'std'}__${selectedFlavor || 'none'}`;
  const inCartQty = cartQtyByKey.get(cartKey) ?? 0;
  const isAdded = inCartQty > 0;

  return (
    <article
      className="group flex flex-col justify-between rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#171719] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Square 1:1 Image Frame with Skeleton Placeholder & WebP Loading */}
      <div>
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
          <ImageWithSkeleton
            imgRef={imgRef}
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-neutral-100 dark:bg-neutral-900">
                <UtensilsCrossed className="w-8 h-8 text-neutral-700 dark:text-neutral-300 mb-2" />
                <span className="font-display text-lg font-semibold text-neutral-900 dark:text-white">
                  {item.name}
                </span>
              </div>
            }
          />

          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            aria-label={isFavorite ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-[#111113]/85 backdrop-blur-xs flex items-center justify-center text-neutral-900 dark:text-white shadow-sm hover:scale-105 transition-transform cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                isFavorite ? 'fill-neutral-950 dark:fill-white text-neutral-950 dark:text-white' : ''
              }`}
            />
          </button>
        </div>

        {/* Clean Unboxed Metadata + Prose */}
        <div className="p-2 sm:p-5 space-y-1 sm:space-y-2">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">
            {item.categoryLabel}
          </p>
          <h3 className="font-display text-[15px] sm:text-xl font-bold leading-snug text-neutral-950 dark:text-white line-clamp-1 sm:line-clamp-none">
            {item.name}
          </h3>
          <p className="text-[11px] sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-2">
            {item.description}
          </p>

          {/* Optional Variant Selector */}
          {item.variants && item.variants.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1 sm:gap-1.5">
              {item.variants.map((variant, idx) => (
                <button
                  key={variant.label}
                  type="button"
                  onClick={() => setSelectedVariantIdx(idx)}
                  className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedVariantIdx === idx
                      ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/15'
                  }`}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          )}

          {/* Optional Coffee Flavour Add-on (+Rs. 250) */}
          {item.addFlavourOption && (
            <div className="pt-1">
              <select
                aria-label={`Add flavour to ${item.name}`}
                value={selectedFlavor}
                onChange={(e) => setSelectedFlavor(e.target.value)}
                className="w-full px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-neutral-300 dark:border-white/15 bg-neutral-50 dark:bg-[#111113] text-[10px] sm:text-xs text-neutral-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white cursor-pointer"
              >
                <option value="">No Extra Flavour</option>
                {COFFEE_FLAVORS.map((fl) => (
                  <option key={fl} value={fl}>
                    + {fl} (+Rs. 250)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Price & Add to Cart Footer — Compact on 2-col Mobile so Button Never Clips */}
      <div className="px-2 sm:px-5 pb-2.5 sm:pb-5 pt-2 sm:pt-2.5 flex items-center justify-between gap-1 sm:gap-3 border-t border-neutral-100 dark:border-white/10 min-w-0">
        <span className="font-mono-num text-[11px] sm:text-lg font-bold tracking-tight text-neutral-950 dark:text-white whitespace-nowrap shrink-0">
          {formatRs(finalPrice)}
        </span>

        <motion.button
          key={tapPulseKey}
          type="button"
          initial={tapPulseKey > 0 ? { scale: 0.88 } : false}
          animate={{ scale: tapPulseKey > 0 ? [0.88, 1.09, 0.97, 1] : 1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.36, ease: [0.34, 1.56, 0.64, 1] }}
          onClick={() => {
            setTapPulseKey((k) => k + 1);
            onAddToCart(
              item,
              imgRef.current,
              activeVariant?.label,
              finalPrice,
              selectedFlavor || undefined
            );
          }}
          className={`inline-flex items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isAdded
              ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-300/90 dark:hover:bg-neutral-600'
              : 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90'
          }`}
        >
          {isAdded ? <Check className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> : <Plus className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />}
          <span className="sm:hidden">{isAdded ? (inCartQty > 1 ? `Added (${inCartQty})` : 'Added') : 'Add'}</span>
          <span className="hidden sm:inline">{isAdded ? (inCartQty > 1 ? `Added (${inCartQty})` : 'Added') : 'Add to Cart'}</span>
        </motion.button>
      </div>
    </article>
  );
}

export function MenuSection({
  favoriteIds,
  cartQtyByKey,
  onToggleFavorite,
  onAddToCart,
}: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<MenuCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { isSupported: voiceSupported, isListening, error: voiceError, toggleListening } = useVoiceInput();

  // Bouncing Ping-Pong Step Carousel State for Category Filter Buttons
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const syncBounds = () => {
      if (!viewportRef.current || !trackRef.current) return;
      const nextMax = Math.max(0, trackRef.current.scrollWidth - viewportRef.current.clientWidth);
      setMaxOffset(nextMax);
      setOffsetX((prev) => Math.min(prev, nextMax));
    };

    syncBounds();
    const observer = new ResizeObserver(syncBounds);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (trackRef.current) observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, []);

  const stepCarousel = (dir: 1 | -1, stepPx: number) => {
    if (maxOffset <= 0) return;
    if (dir === 1) {
      const next = offsetX + stepPx;
      if (next >= maxOffset - 4) {
        setOffsetX(maxOffset);
        setStepDirection(-1);
      } else {
        setOffsetX(next);
      }
    } else {
      const next = offsetX - stepPx;
      if (next <= 4) {
        setOffsetX(0);
        setStepDirection(1);
      } else {
        setOffsetX(next);
      }
    }
  };

  const handleCategoryClick = (catId: MenuCategoryId) => {
    setActiveCategory((prev) => (prev === catId ? 'all' : catId));

    const viewport = viewportRef.current;
    if (!viewport || maxOffset <= 0) return;

    // Gentle button-by-button step (~135px) so hidden buttons slide in smoothly without teleporting
    const stepPx = Math.min(145, Math.max(115, Math.round(viewport.clientWidth * 0.16)));
    stepCarousel(stepDirection, stepPx);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      const catMatch = activeCategory === 'all' || item.category === activeCategory;
      const searchMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="menu" className="w-full">
      {/* Search Bar & Animated Bouncing Category Filter Strip Directly Below Hero Image */}
      <div className="border-b border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-3.5 lg:gap-4">
          {/* Search Input with Web Speech Voice-to-Text */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isListening ? 'Listening... speak a dish name' : 'Search burgers, pizzas, coffee...'}
              className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#171719] text-sm text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={() =>
                  toggleListening((transcript) => {
                    setSearchQuery(transcript);
                  })
                }
                aria-label={isListening ? 'Stop voice search' : 'Search menu by voice'}
                title={isListening ? 'Listening... tap to stop' : 'Voice Search'}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            {voiceError && (
              <p className="absolute left-0 top-full mt-1 text-[11px] font-medium text-red-600 dark:text-rose-400 z-20">
                {voiceError}
              </p>
            )}
          </div>

          {/* Bouncing Forward/Reverse Category Carousel (No 'All Menu' Button) */}
          <div className="relative flex items-center gap-1.5 flex-1 min-w-0">
            {maxOffset > 0 && (
              <button
                type="button"
                aria-label="Scroll categories left"
                disabled={offsetX <= 2}
                onClick={() => stepCarousel(-1, 180)}
                className="w-8 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#171719] text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0 hover:border-neutral-400 dark:hover:border-white/30 disabled:opacity-30 disabled:cursor-default transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div ref={viewportRef} className="relative flex-1 min-w-0 overflow-hidden py-1.5">
              {/* Soft edge fades so overflowing items never appear harshly chopped */}
              {offsetX > 4 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-7 z-10 bg-gradient-to-r from-white dark:from-[#121214] to-transparent"
                />
              )}
              {offsetX < maxOffset - 4 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-7 z-10 bg-gradient-to-l from-white dark:from-[#121214] to-transparent"
                />
              )}

              <motion.div
                ref={trackRef}
                animate={{ x: -offsetX }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 21,
                  mass: 0.78,
                }}
                className="flex items-center gap-2.5 w-max px-0.5"
              >
                {VISIBLE_CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <motion.button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.id)}
                      whileTap={{ scale: 0.93 }}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        active
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                          : 'border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#171719] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-white/30'
                      }`}
                    >
                      {cat.label}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {maxOffset > 0 && (
              <button
                type="button"
                aria-label="Scroll categories right"
                disabled={offsetX >= maxOffset - 2}
                onClick={() => stepCarousel(1, 180)}
                className="w-8 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#171719] text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0 hover:border-neutral-400 dark:hover:border-white/30 disabled:opacity-30 disabled:cursor-default transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Grid Container */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-8 sm:py-14 space-y-6 sm:space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4 px-1 sm:px-0">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              All Day Eatery Selection
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-950 dark:text-white">
              Our Signature Menu
            </h2>
          </div>

          {activeCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Show all dishes ({MENU_ITEMS.length})
            </button>
          )}
        </div>

        {/* Square Cards Grid — 2 Items Per Row on Mobile with Compact Spacing */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#171719] p-12 text-center space-y-3">
            <p className="font-display text-2xl font-semibold">No dishes matched your search</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Try clearing your search filter or browsing another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5 lg:gap-6">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                isFavorite={favoriteIds.has(item.id)}
                cartQtyByKey={cartQtyByKey}
                onToggleFavorite={onToggleFavorite}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
