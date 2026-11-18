import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Crosshair,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Utensils,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { KARACHI_AREAS, KarachiArea, RESTAURANT_COORDS, findNearestKarachiArea } from '../data/karachiAreas';
import { MENU_ITEMS, MenuItem, formatRs } from '../data/menuData';
import { parseVoiceOrderItems, useVoiceInput } from '../hooks/useVoiceInput';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import type {
  CartItem,
  CustomerProfile,
  DeliveryQuote,
  OrderRecord,
  OrderType,
  PaymentMethod,
} from '../types/order';

interface CartCheckoutDrawerProps {
  open: boolean;
  items: CartItem[];
  orderType: OrderType;
  selectedArea: KarachiArea;
  detectedCoords: { lat: number; lng: number } | null;
  user: User | null;
  profile: CustomerProfile | null;
  onClose: () => void;
  onUpdateQty: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onVoiceAddItems?: (matches: { item: MenuItem; quantity: number }[]) => void;
  onChangeOrderType: (type: OrderType) => void;
  onChangeArea: (area: KarachiArea, coords?: { lat: number; lng: number } | null) => void;
  onPlaceOrder: (payload: {
    customerName: string;
    customerPhone: string;
    orderType: OrderType;
    areaName: string;
    deliveryAddress: string;
    distanceKm: number;
    deliveryFee: number;
    paymentMethod: PaymentMethod;
    notes: string;
  }) => Promise<OrderRecord>;
  onOrderSuccess: (order: OrderRecord) => void;
}

export function CartCheckoutDrawer({
  open,
  items,
  orderType,
  selectedArea,
  detectedCoords,
  user,
  profile,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onVoiceAddItems,
  onChangeOrderType,
  onChangeArea,
  onPlaceOrder,
  onOrderSuccess,
}: CartCheckoutDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [guestCount, setGuestCount] = useState('2 Guests');
  const [arrivalTime, setArrivalTime] = useState('Within 45 mins');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [voiceTarget, setVoiceTarget] = useState<'order' | 'address' | 'notes' | null>(null);

  const { isSupported: voiceSupported, isListening, error: voiceError, toggleListening } =
    useVoiceInput();

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Pre-fill from Google profile when opening
  useEffect(() => {
    if (open) {
      setCustomerName((prev) => prev || profile?.displayName || user?.displayName || '');
      setCustomerPhone((prev) => prev || profile?.phone || '');
      setDeliveryAddress((prev) => prev || profile?.defaultAddress || '');
    } else {
      setStep('cart');
      setFormError(null);
    }
  }, [open, profile, user]);

  // Adjust default payment method when orderType changes
  useEffect(() => {
    if (orderType === 'delivery') {
      if (paymentMethod === 'pay_at_counter') setPaymentMethod('cash_on_delivery');
    } else {
      setPaymentMethod('pay_at_counter');
    }
  }, [orderType, paymentMethod]);

  // Fetch distance-based delivery quote ONLY during checkout when orderType === 'delivery'
  useEffect(() => {
    if (!open || step !== 'checkout' || orderType !== 'delivery') {
      return;
    }

    let cancelled = false;
    const loadQuote = async () => {
      setQuoteLoading(true);
      try {
        const res = await fetch('/api/delivery-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            areaId: selectedArea.id,
            lat: detectedCoords?.lat,
            lng: detectedCoords?.lng,
          }),
        });
        if (res.ok && !cancelled) {
          const data: DeliveryQuote = await res.json();
          setQuote(data);
        }
      } catch {
        // Silent fallback
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    };

    loadQuote();
    return () => {
      cancelled = true;
    };
  }, [open, step, orderType, selectedArea.id, detectedCoords]);

  const activeDeliveryFee = orderType === 'delivery' ? (quote?.deliveryFee ?? 150) : 0;
  const activeDistanceKm = orderType === 'delivery' ? (quote?.distanceKm ?? 3.5) : 0;
  const grandTotal = subtotal + activeDeliveryFee;

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      setFormError('GPS is unavailable in this browser. Please select your Karachi area manually.');
      return;
    }
    setDetectingGps(true);
    setFormError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch('/api/detect-area', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.area) {
              onChangeArea(data.area, { lat, lng });
              setQuote({
                areaId: data.area.id,
                areaName: data.area.name,
                distanceKm: data.distanceKm,
                deliveryFee: data.deliveryFee,
                estimatedMinutes: data.estimatedMinutes,
              });
              setDetectingGps(false);
              return;
            }
          }
        } catch {
          // fallback below
        }
        const { area } = findNearestKarachiArea(lat, lng);
        onChangeArea(area, { lat, lng });
        setDetectingGps(false);
      },
      () => {
        setFormError('Location access denied. Please select your Karachi area from the dropdown.');
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (customerName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (customerPhone.trim().length < 7) {
      setFormError('Please enter a valid mobile number (e.g. 03001234567).');
      return;
    }
    if (orderType === 'delivery' && deliveryAddress.trim().length < 6) {
      setFormError('Please enter your street, house, or flat address for delivery.');
      return;
    }

    setSubmitting(true);
    try {
      const combinedNotes =
        orderType === 'dine-in'
          ? `Dine-In (${guestCount}, ${arrivalTime})${notes.trim() ? ` · ${notes.trim()}` : ''}`
          : notes.trim();

      const placedOrder = await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        areaName: orderType === 'delivery' ? selectedArea.name : 'Hotel Excelsior, Saddar',
        deliveryAddress:
          orderType === 'delivery' ? deliveryAddress.trim() : RESTAURANT_COORDS.address,
        distanceKm: activeDistanceKm,
        deliveryFee: activeDeliveryFee,
        paymentMethod,
        notes: combinedNotes,
      });
      onOrderSuccess(placedOrder);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to place order right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative z-10 w-full max-w-md h-full flex flex-col bg-white dark:bg-[#131315] text-neutral-950 dark:text-white border-l border-neutral-200 dark:border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {step === 'checkout' && (
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    aria-label="Back to cart"
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="font-display text-2xl font-bold">
                  {step === 'cart' ? 'Your Order' : 'Checkout'}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-900 dark:text-white">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl font-semibold">Your bag is empty</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
                  Add burgers, wood-fired pizza, sandwiches, coffee, or desserts — or use voice order below.
                </p>

                {voiceSupported && onVoiceAddItems && (
                  <div className="w-full max-w-xs space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceTarget('order');
                        setVoiceStatus(null);
                        toggleListening((transcript, isFinal) => {
                          if (!isFinal) {
                            setVoiceStatus(`Heard: "${transcript}"...`);
                            return;
                          }
                          const matched = parseVoiceOrderItems(transcript, MENU_ITEMS);
                          if (matched.length > 0) {
                            onVoiceAddItems(matched);
                            setVoiceStatus(
                              `Added: ${matched.map((m) => `${m.quantity}× ${m.item.name}`).join(', ')}`
                            );
                          } else {
                            setVoiceStatus(`Couldn't match "${transcript}". Try saying e.g. "2 Pepperoni Pizza".`);
                          }
                        });
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        isListening && voiceTarget === 'order'
                          ? 'bg-red-500 text-white border-red-500 animate-pulse'
                          : 'border-neutral-300 dark:border-white/20 bg-neutral-50 dark:bg-white/5 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {isListening && voiceTarget === 'order' ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                      <span>
                        {isListening && voiceTarget === 'order'
                          ? 'Listening... Speak your order'
                          : 'Voice Order (Hands-Free)'}
                      </span>
                    </button>
                    {(voiceStatus || voiceError) && (
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                        {voiceError || voiceStatus}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-1 px-5 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : step === 'cart' ? (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                  {voiceSupported && onVoiceAddItems && (
                    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1B1B1E] p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          Hands-Free Voice Add
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setVoiceTarget('order');
                            setVoiceStatus(null);
                            toggleListening((transcript, isFinal) => {
                              if (!isFinal) {
                                setVoiceStatus(`Heard: "${transcript}"...`);
                                return;
                              }
                              const matched = parseVoiceOrderItems(transcript, MENU_ITEMS);
                              if (matched.length > 0) {
                                onVoiceAddItems(matched);
                                setVoiceStatus(
                                  `Added: ${matched.map((m) => `${m.quantity}× ${m.item.name}`).join(', ')}`
                                );
                              } else {
                                setVoiceStatus(`No dish matched "${transcript}". Try "1 Club Sandwich".`);
                              }
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isListening && voiceTarget === 'order'
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90'
                          }`}
                        >
                          {isListening && voiceTarget === 'order' ? (
                            <MicOff className="w-3.5 h-3.5" />
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                          <span>{isListening && voiceTarget === 'order' ? 'Listening...' : 'Speak Dish'}</span>
                        </button>
                      </div>
                      {(voiceStatus || voiceError) && (
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                          {voiceError || voiceStatus}
                        </p>
                      )}
                    </div>
                  )}

                  {items.map((item) => (
                    <div
                      key={item.cartKey}
                      className="flex gap-3.5 p-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1B1B1E]"
                    >
                      <div className="w-18 h-18 rounded-lg overflow-hidden shrink-0 bg-neutral-200 dark:bg-neutral-800">
                        <ImageWithSkeleton
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                            {(item.variantLabel || item.flavorAddon) && (
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                {[item.variantLabel, item.flavorAddon ? `+ ${item.flavorAddon}` : '']
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.cartKey)}
                            aria-label={`Remove ${item.name}`}
                            className="p-1 text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="font-mono-num text-sm font-bold text-neutral-950 dark:text-white">
                            {formatRs(item.unitPrice * item.quantity)}
                          </span>

                          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-white/15 px-1.5 py-0.5 bg-white dark:bg-[#111113]">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.cartKey, -1)}
                              aria-label="Decrease quantity"
                              className="p-1 hover:opacity-70 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono-num text-xs font-semibold w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.cartKey, 1)}
                              aria-label="Increase quantity"
                              className="p-1 hover:opacity-70 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161618] space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300">Subtotal</span>
                    <span className="font-mono-num text-base font-bold">{formatRs(subtotal)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="w-full py-3.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold shadow-md hover:opacity-90 transition-all cursor-pointer"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Order Type Selector */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10">
                    {[
                      { id: 'delivery' as OrderType, label: 'Delivery', icon: Truck },
                      { id: 'takeaway' as OrderType, label: 'Takeaway', icon: ShoppingBag },
                      { id: 'dine-in' as OrderType, label: 'Dine-In', icon: Utensils },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onChangeOrderType(id)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          orderType === id
                            ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ali Raza"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Mobile / WhatsApp Number</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      />
                    </div>
                  </div>

                  {/* Conditional Delivery / Takeaway / Dine-In Details */}
                  {orderType === 'delivery' ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold">Karachi Delivery Area</label>
                        <button
                          type="button"
                          onClick={handleGpsDetect}
                          disabled={detectingGps}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 dark:text-neutral-200 hover:underline cursor-pointer disabled:opacity-60"
                        >
                          {detectingGps ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Crosshair className="w-3.5 h-3.5" />
                          )}
                          <span>Auto-Detect GPS</span>
                        </button>
                      </div>

                      <div className="relative">
                        <MapPin className="w-4 h-4 text-neutral-700 dark:text-neutral-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={selectedArea.id}
                          onChange={(e) => {
                            const next = KARACHI_AREAS.find((a) => a.id === e.target.value);
                            if (next) onChangeArea(next, null);
                          }}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white cursor-pointer"
                        >
                          {KARACHI_AREAS.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.name} ({area.zone})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold">Complete Street Address</label>
                          {voiceSupported && (
                            <button
                              type="button"
                              onClick={() => {
                                setVoiceTarget('address');
                                toggleListening((transcript) => {
                                  setDeliveryAddress(transcript);
                                });
                              }}
                              aria-label="Dictate street address"
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md cursor-pointer ${
                                isListening && voiceTarget === 'address'
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                              }`}
                            >
                              <Mic className="w-3 h-3" />
                              <span>{isListening && voiceTarget === 'address' ? 'Listening' : 'Voice'}</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="House / Flat No, Street, Block / Phase, Landmark..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
                        />
                      </div>

                      {/* Payment Method for Delivery */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash_on_delivery')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              paymentMethod === 'cash_on_delivery'
                                ? 'border-neutral-950 dark:border-white bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                                : 'border-neutral-300 dark:border-white/15'
                            }`}
                          >
                            <Banknote className="w-4 h-4" />
                            <span>Cash on Delivery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card_on_delivery')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              paymentMethod === 'card_on_delivery'
                                ? 'border-neutral-950 dark:border-white bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                                : 'border-neutral-300 dark:border-white/15'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Card on Delivery</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : orderType === 'dine-in' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Party Size</label>
                        <select
                          value={guestCount}
                          onChange={(e) => setGuestCount(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm"
                        >
                          {['1 Guest', '2 Guests', '4 Guests', '6 Guests', '8+ Guests'].map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Arrival Time</label>
                        <select
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm"
                        >
                          {['Within 30 mins', 'Within 45 mins', 'In 1 Hour', 'Tonight 8:00 PM', 'Tonight 10:00 PM'].map(
                            (t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#1B1B1E] p-3.5 text-xs text-neutral-600 dark:text-neutral-300">
                      Pickup at <strong className="text-neutral-950 dark:text-white">Hotel Excelsior, Opposite Atrium Mall, Saddar</strong>. Estimated preparation: 20–25 minutes.
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold">Kitchen / Rider Notes (Optional)</label>
                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={() => {
                            setVoiceTarget('notes');
                            toggleListening((transcript) => {
                              setNotes(transcript);
                            });
                          }}
                          aria-label="Dictate order notes"
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md cursor-pointer ${
                            isListening && voiceTarget === 'notes'
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                          }`}
                        >
                          <Mic className="w-3 h-3" />
                          <span>{isListening && voiceTarget === 'notes' ? 'Listening' : 'Voice'}</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Spice preference, gate instructions..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs font-medium text-red-700 dark:text-rose-300 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                      {formError}
                    </p>
                  )}
                </div>

                {/* Summary & Submit */}
                <div className="p-5 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161618] space-y-2.5">
                  <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300">
                    <span>Subtotal</span>
                    <span className="font-mono-num">{formatRs(subtotal)}</span>
                  </div>

                  {orderType === 'delivery' && (
                    <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300">
                      <span>
                        Delivery Fee ({activeDistanceKm.toFixed(1)} km from Saddar)
                      </span>
                      <span className="font-mono-num">
                        {quoteLoading ? 'Calculating...' : formatRs(activeDeliveryFee)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-bold pt-1.5 border-t border-neutral-200 dark:border-white/10">
                    <span>Total Payable</span>
                    <span className="font-mono-num text-neutral-950 dark:text-white">
                      {formatRs(grandTotal)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || quoteLoading}
                    className="w-full py-3.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? 'Confirming Order...' : 'Place Order'}</span>
                  </button>
                </div>
              </form>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
