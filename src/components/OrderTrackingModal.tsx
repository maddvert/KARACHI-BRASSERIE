import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CheckCircle2, ChefHat, Clock, MapPin, PackageCheck, Truck, X } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { RESTAURANT_COORDS } from '../data/karachiAreas';
import { formatRs } from '../data/menuData';
import type { OrderRecord, OrderStatus } from '../types/order';
import { WhatsAppIcon } from './ExperienceAndFooter';

interface OrderTrackingModalProps {
  order: OrderRecord | null;
  onClose: () => void;
}

const STEP_INDEX: Record<OrderStatus, number> = {
  confirmed: 0,
  preparing: 1,
  out_for_delivery: 2,
  ready: 2,
  completed: 3,
};

export function OrderTrackingModal({ order: initialOrder, onClose }: OrderTrackingModalProps) {
  const [liveOrder, setLiveOrder] = useState<OrderRecord | null>(initialOrder);

  useEffect(() => {
    setLiveOrder(initialOrder);
  }, [initialOrder]);

  // Live poll guest/server status when modal is open and order isn't completed
  useEffect(() => {
    if (!liveOrder || liveOrder.status === 'completed') return;

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(liveOrder.orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setLiveOrder(data.order);
            if (
              data.order.status !== liveOrder.status &&
              auth.currentUser?.emailVerified &&
              liveOrder.userId === auth.currentUser.uid
            ) {
              updateDoc(doc(db, 'orders', liveOrder.orderId), {
                status: data.order.status,
                updatedAt: serverTimestamp(),
              }).catch(() => {
                // Non-blocking status sync
              });
            }
          }
        }
      } catch {
        // ignore transient errors
      }
    }, 6000);

    return () => window.clearInterval(timer);
  }, [liveOrder?.orderId, liveOrder?.status, liveOrder?.userId]);

  const activeStep = liveOrder ? (STEP_INDEX[liveOrder.status] ?? 0) : 0;
  const stagePercentages = [25, 55, 82, 100];
  const progressPercent = stagePercentages[activeStep] ?? 25;

  const steps = liveOrder
    ? liveOrder.orderType === 'delivery'
      ? [
          { shortLabel: 'Confirmed', label: 'Order Confirmed', desc: 'Received by Karachi Brasserie', icon: CheckCircle2 },
          { shortLabel: 'Cooking', label: 'Cooking', desc: 'Chef is freshly firing your meal', icon: ChefHat },
          { shortLabel: 'Out for Delivery', label: 'Out for Delivery', desc: `Rider heading to ${liveOrder.areaName}`, icon: Truck },
          { shortLabel: 'Delivered', label: 'Delivered', desc: 'Enjoy your meal', icon: PackageCheck },
        ]
      : liveOrder.orderType === 'takeaway'
      ? [
          { shortLabel: 'Confirmed', label: 'Order Confirmed', desc: 'Received by Saddar Kitchen', icon: CheckCircle2 },
          { shortLabel: 'Cooking', label: 'Cooking', desc: 'Freshly prepared & packed hot', icon: ChefHat },
          { shortLabel: 'Ready', label: 'Ready for Pickup', desc: 'At Hotel Excelsior counter', icon: PackageCheck },
          { shortLabel: 'Collected', label: 'Collected', desc: 'Thank you for dining with us', icon: CheckCircle2 },
        ]
      : [
          { shortLabel: 'Confirmed', label: 'Table & Order Confirmed', desc: 'Reserved at Hotel Excelsior', icon: CheckCircle2 },
          { shortLabel: 'Cooking', label: 'Cooking', desc: 'Kitchen is firing your dishes', icon: ChefHat },
          { shortLabel: 'Ready', label: 'Ready to Serve', desc: 'Arriving at your table', icon: Clock },
          { shortLabel: 'Served', label: 'Served', desc: 'Enjoy your evening', icon: PackageCheck },
        ]
    : [];

  const waText = liveOrder
    ? encodeURIComponent(
        `Hello Karachi Brasserie! Regarding Order #${liveOrder.orderId} (${liveOrder.orderType.toUpperCase()}) for ${liveOrder.customerName} — Total ${formatRs(liveOrder.total)}.`
      )
    : '';

  return (
    <AnimatePresence>
      {liveOrder && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
          <motion.div
            key={liveOrder.orderId}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#141416] text-neutral-950 dark:text-white shadow-2xl"
          >
          {/* Top Confirmation Banner */}
          <div className="relative bg-neutral-950 dark:bg-black px-6 py-5 text-white border-b border-white/10">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close order tracker"
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="text-xs uppercase tracking-widest text-neutral-300 font-semibold">
              Live Order Tracking
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-0.5">
              Order #{liveOrder.orderId}
            </h2>
            <p className="text-xs text-neutral-300 mt-1">
              {liveOrder.orderType === 'delivery'
                ? 'Cash / Card on Delivery · Karachi Brasserie Saddar'
                : liveOrder.orderType === 'takeaway'
                ? 'Takeaway Pickup · Hotel Excelsior, Saddar'
                : 'Dine-In Service · Hotel Excelsior, Saddar'}
            </p>
          </div>

          <div className="kb-chevron-strip" aria-hidden="true" />

          <div className="p-6 space-y-6">
            {/* Animated Framer Motion Progress Bar */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-700 dark:text-neutral-200">
                  Stage: {steps[activeStep]?.label}
                </span>
                <span className="font-mono-num text-neutral-500 dark:text-neutral-400">
                  {progressPercent}%
                </span>
              </div>

              <div className="relative h-2.5 w-full rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-neutral-950 dark:bg-white relative"
                />
              </div>

              <div className="grid grid-cols-4 gap-1 pt-0.5">
                {steps.map((step, idx) => {
                  const done = idx <= activeStep;
                  return (
                    <span
                      key={step.shortLabel}
                      className={`text-[10px] font-semibold truncate ${
                        idx === 0
                          ? 'text-left'
                          : idx === steps.length - 1
                          ? 'text-right'
                          : 'text-center'
                      } ${
                        done
                          ? 'text-neutral-950 dark:text-white'
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      {step.shortLabel}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const done = idx <= activeStep;
                const current = idx === activeStep;
                return (
                  <motion.div
                    key={step.label}
                    initial={false}
                    animate={{ opacity: done ? 1 : 0.65, x: current ? 2 : 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-3.5"
                  >
                    <motion.div
                      animate={{ scale: current ? 1.06 : 1 }}
                      transition={{ duration: 0.3 }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        done
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                          : 'bg-neutral-100 dark:bg-white/10 text-neutral-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          current
                            ? 'text-neutral-950 dark:text-white'
                            : done
                            ? 'text-neutral-800 dark:text-neutral-200'
                            : 'text-neutral-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Destination Summary */}
            <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1B1B1E] p-4 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{liveOrder.customerName} · {liveOrder.customerPhone}</p>
                  <p className="text-neutral-600 dark:text-neutral-300 mt-0.5">
                    {liveOrder.areaName} — {liveOrder.deliveryAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Breakdown */}
            <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1B1B1E] p-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Order Receipt
              </p>
              <div className="space-y-1.5 text-sm">
                {liveOrder.items.map((it, idx) => (
                  <div key={`${it.id}-${idx}`} className="flex justify-between gap-2">
                    <span className="text-neutral-700 dark:text-neutral-200">
                      {it.quantity}× {it.name}
                      {it.variantLabel ? ` (${it.variantLabel})` : ''}
                      {it.flavorAddon ? ` + ${it.flavorAddon}` : ''}
                    </span>
                    <span className="font-mono-num font-medium shrink-0">
                      {formatRs(it.unitPrice * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2.5 border-t border-neutral-200 dark:border-white/10 space-y-1 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                  <span>Subtotal</span>
                  <span className="font-mono-num">{formatRs(liveOrder.subtotal)}</span>
                </div>
                {liveOrder.orderType === 'delivery' && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                    <span>Delivery Fee ({(liveOrder.distanceKm ?? 0).toFixed(1)} km)</span>
                    <span className="font-mono-num">{formatRs(liveOrder.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span>
                    Total ({liveOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : liveOrder.paymentMethod === 'card_on_delivery' ? 'Card on Delivery' : 'Pay at Restaurant'})
                  </span>
                  <span className="font-mono-num text-neutral-950 dark:text-white">
                    {formatRs(liveOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Order Support */}
            <a
              href={`https://wa.me/${RESTAURANT_COORDS.whatsappE164}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#1F9D55] hover:bg-[#198748] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Chat About This Order on WhatsApp</span>
            </a>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
