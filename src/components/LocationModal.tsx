import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair, Loader2, MapPin, ShoppingBag, Utensils, Truck, X, Search } from 'lucide-react';
import { KARACHI_AREAS, KarachiArea, findNearestKarachiArea } from '../data/karachiAreas';
import type { OrderType } from '../types/order';

interface LocationModalProps {
  open: boolean;
  isDark: boolean;
  canDismiss: boolean;
  orderType: OrderType;
  selectedArea: KarachiArea;
  onClose: () => void;
  onConfirm: (params: {
    orderType: OrderType;
    area: KarachiArea;
    detectedCoords?: { lat: number; lng: number } | null;
  }) => void;
}

export function LocationModal({
  open,
  canDismiss,
  orderType: initialOrderType,
  selectedArea: initialArea,
  onClose,
  onConfirm,
}: LocationModalProps) {
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(initialArea.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (open) {
      setOrderType(initialOrderType);
      setSelectedAreaId(initialArea.id);
      setSearchQuery('');
      setDetectMsg(null);
    }
  }, [open, initialOrderType, initialArea.id]);

  const logoSrc = '/assets/aistudio/logo-dark.webp';

  const filteredAreas = searchQuery.trim()
    ? KARACHI_AREAS.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.zone.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : KARACHI_AREAS;

  const activeArea = KARACHI_AREAS.find((a) => a.id === selectedAreaId) ?? KARACHI_AREAS[0];

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setDetectMsg('Location detection is unavailable in this browser. Please select your Karachi area below.');
      return;
    }

    setDetecting(true);
    setDetectMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDetectedCoords({ lat, lng });

        try {
          const res = await fetch('/api/detect-area', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.area?.id) {
              setSelectedAreaId(data.area.id);
              setDetectMsg(`Location matched to ${data.area.name}`);
              setDetecting(false);
              return;
            }
          }
        } catch {
          // Local fallback below
        }

        const { area } = findNearestKarachiArea(lat, lng);
        setSelectedAreaId(area.id);
        setDetectMsg(`Location matched to ${area.name}`);
        setDetecting(false);
      },
      () => {
        setDetectMsg('Could not access GPS permission. Please choose your Karachi area from the list.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    onConfirm({
      orderType,
      area: activeArea,
      detectedCoords,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="location-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#161618] text-neutral-950 dark:text-white shadow-2xl"
          >
            {/* Brand Header */}
            <div className="relative bg-neutral-950 dark:bg-black px-6 py-5 text-white border-b border-white/10">
              {canDismiss && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close location modal"
                  className="absolute right-4 top-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex flex-col items-center text-center gap-2">
                <img
                  src={logoSrc}
                  alt="Karachi Brasserie"
                  className="w-24 h-24 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="font-display text-3xl font-semibold tracking-wider">Select Your Order Type</h2>
                  <p className="text-xs text-neutral-300 mt-0.5">Karachi · Hotel Excelsior, Saddar</p>
                </div>
              </div>
            </div>

            <div className="kb-chevron-strip" aria-hidden="true" />

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Order Type Segmented Buttons */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10">
                {[
                  { id: 'delivery' as OrderType, label: 'Delivery', icon: Truck },
                  { id: 'takeaway' as OrderType, label: 'Takeaway', icon: ShoppingBag },
                  { id: 'dine-in' as OrderType, label: 'Dine-In', icon: Utensils },
                ].map(({ id, label, icon: Icon }) => {
                  const active = orderType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOrderType(id)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {orderType === 'delivery' ? (
                <div className="space-y-3.5">
                  <div className="text-center">
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                      Detect your location or choose any Karachi area
                    </p>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={detecting}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {detecting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Getting Location...</span>
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>Use Current Location</span>
                        </>
                      )}
                    </button>
                    {detectMsg && (
                      <p className="mt-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">{detectMsg}</p>
                    )}
                  </div>

                  {/* Area Search & Dropdown */}
                  <div className="space-y-2">
                    <label
                      htmlFor="karachi-area-select"
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                    >
                      Please select your area in Karachi
                    </label>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter Karachi area (e.g. Clifton, DHA, Surjani)..."
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      />
                    </div>

                    <div className="relative">
                      <MapPin className="w-4 h-4 text-neutral-700 dark:text-neutral-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        id="karachi-area-select"
                        value={selectedAreaId}
                        onChange={(e) => {
                          setSelectedAreaId(e.target.value);
                          setDetectedCoords(null);
                        }}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white cursor-pointer"
                      >
                        {filteredAreas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name} ({area.zone})
                          </option>
                        ))}
                        {filteredAreas.length === 0 && (
                          <option value={activeArea.id}>{activeArea.name}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 p-4 text-center space-y-1.5">
                  <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                    {orderType === 'takeaway'
                      ? 'Pickup from Hotel Excelsior, Saddar'
                      : 'Dine-In at Karachi Brasserie'}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    Opposite Atrium Mall, Saddar Town, Karachi · Open Daily 12:00 PM – 12:00 AM
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-3 px-4 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold shadow-md hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              >
                Confirm Selection
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
