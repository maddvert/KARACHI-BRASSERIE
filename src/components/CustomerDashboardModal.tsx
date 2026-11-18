import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Heart,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  TrendingUp,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { User } from 'firebase/auth';
import { KARACHI_AREAS } from '../data/karachiAreas';
import { MENU_ITEMS, MenuItem, formatRs } from '../data/menuData';
import type { CustomerProfile, OrderRecord } from '../types/order';
import { GoogleLogoIcon } from './Header';

interface CustomerDashboardModalProps {
  open: boolean;
  user: User | null;
  profile: CustomerProfile | null;
  orders: OrderRecord[];
  favoriteIds: Set<string>;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSaveProfile: (updates: { phone: string; defaultArea: string; defaultAddress: string }) => Promise<void>;
  onTrackOrder: (order: OrderRecord) => void;
  onReorder: (order: OrderRecord) => void;
  onAddFavoriteToCart: (item: MenuItem) => void;
}

interface MonthlySpendPoint {
  monthKey: string;
  label: string;
  totalSpent: number;
  orderCount: number;
}

export function CustomerDashboardModal({
  open,
  user,
  profile,
  orders,
  favoriteIds,
  onClose,
  onGoogleLogin,
  onSignOut,
  onSaveProfile,
  onTrackOrder,
  onReorder,
  onAddFavoriteToCart,
}: CustomerDashboardModalProps) {
  const [tab, setTab] = useState<'orders' | 'address' | 'favorites'>('orders');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [defaultArea, setDefaultArea] = useState(profile?.defaultArea || KARACHI_AREAS[0].name);
  const [defaultAddress, setDefaultAddress] = useState(profile?.defaultAddress || '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setDefaultArea(profile.defaultArea || KARACHI_AREAS[0].name);
      setDefaultAddress(profile.defaultAddress || '');
    }
  }, [profile, open]);

  const favoriteItems = MENU_ITEMS.filter((m) => favoriteIds.has(m.id));

  const { monthlySpending, completedCount, totalCompletedSpend } = useMemo(() => {
    const completedOrders = orders.filter((ord) => ord.status === 'completed');
    const byMonth = new Map<string, MonthlySpendPoint>();

    for (const ord of completedOrders) {
      const date = new Date(ord.createdAtIso);
      if (Number.isNaN(date.getTime())) continue;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const existing = byMonth.get(monthKey);
      if (existing) {
        existing.totalSpent += ord.total;
        existing.orderCount += 1;
      } else {
        byMonth.set(monthKey, {
          monthKey,
          label,
          totalSpent: ord.total,
          orderCount: 1,
        });
      }
    }

    const sorted = Array.from(byMonth.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );
    const totalSum = completedOrders.reduce((acc, ord) => acc + ord.total, 0);

    return {
      monthlySpending: sorted,
      completedCount: completedOrders.length,
      totalCompletedSpend: totalSum,
    };
  }, [orders]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile({ phone, defaultArea, defaultAddress });
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#141416] text-neutral-950 dark:text-white shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-neutral-950 dark:bg-black text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Customer'}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white/40 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold truncate">
                    {user ? user.displayName || 'Customer Dashboard' : 'Customer Account'}
                  </h2>
                  <p className="text-xs text-neutral-300 truncate">
                    {user ? user.email : 'Sign in with Google for order tracking & saved addresses'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {user && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dashboard"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!user ? (
              <div className="p-8 sm:p-10 text-center space-y-5">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center">
                  <GoogleLogoIcon className="w-7 h-7" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="font-display text-2xl font-bold">Welcome to Karachi Brasserie</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    Sign in seamlessly with your Google account to save your Karachi delivery address, track live orders, and reorder your favourite dishes in one tap.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-neutral-300 dark:border-white/20 bg-white dark:bg-[#1B1B1E] text-neutral-950 dark:text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <GoogleLogoIcon className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>
              </div>
            ) : (
              <>
                {/* Navigation Tabs */}
                <div className="px-4 sm:px-6 pt-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-neutral-200 dark:border-white/10">
                  {[
                    { id: 'orders' as const, label: `Orders (${orders.length})`, icon: Package },
                    { id: 'address' as const, label: 'Saved Address', icon: MapPin },
                    { id: 'favorites' as const, label: `Favorites (${favoriteItems.length})`, icon: Heart },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        tab === id
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Panels */}
                <div className="flex-1 overflow-y-auto p-6">
                  {tab === 'orders' && (
                    <div className="space-y-5">
                      {/* Monthly Spending Trends Chart (Completed Orders) */}
                      <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1B1B1E] p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                            <div>
                              <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
                                Monthly Spending Trends
                              </h3>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                Completed order history ({completedCount}{' '}
                                {completedCount === 1 ? 'order' : 'orders'})
                              </p>
                            </div>
                          </div>
                          <span className="font-mono-num text-sm font-bold text-neutral-950 dark:text-white">
                            {formatRs(totalCompletedSpend)}
                          </span>
                        </div>

                        {monthlySpending.length === 0 ? (
                          <div className="h-36 flex items-center justify-center rounded-lg border border-dashed border-neutral-200 dark:border-white/10 px-4 text-center">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Your monthly spending chart will appear here once an order is completed.
                            </p>
                          </div>
                        ) : (
                          <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={monthlySpending}
                                margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="kbSpendGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#737373" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#737373" stopOpacity={0.02} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="rgba(115, 115, 115, 0.2)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="label"
                                  tick={{ fontSize: 11, fill: '#737373' }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fill: '#737373' }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v: number) =>
                                    v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
                                  }
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const pt = payload[0].payload as MonthlySpendPoint;
                                    return (
                                      <div className="rounded-lg border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#141416] px-3 py-2 text-xs shadow-lg">
                                        <p className="font-semibold text-neutral-950 dark:text-white">
                                          {pt.label}
                                        </p>
                                        <p className="font-mono-num font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                                          {formatRs(pt.totalSpent)}
                                        </p>
                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                          {pt.orderCount} completed{' '}
                                          {pt.orderCount === 1 ? 'order' : 'orders'}
                                        </p>
                                      </div>
                                    );
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="totalSpent"
                                  stroke="#737373"
                                  strokeWidth={2}
                                  fill="url(#kbSpendGrad)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      {orders.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                          <Package className="w-8 h-8 mx-auto text-neutral-400" />
                          <p className="font-display text-xl font-semibold">No orders placed yet</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Your completed and active orders will appear here automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {orders.map((ord) => (
                            <div
                              key={ord.orderId}
                              className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1B1B1E] p-4 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-mono-num text-sm font-bold">Order #{ord.orderId}</p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {ord.orderType.toUpperCase()} · {ord.areaName || 'Saddar'}
                                  </p>
                                </div>
                                <span className="font-mono-num text-sm font-bold text-neutral-950 dark:text-white">
                                  {formatRs(ord.total)}
                                </span>
                              </div>

                              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                {ord.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                              </p>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200 dark:border-white/10">
                                <span className="text-xs font-semibold capitalize text-neutral-800 dark:text-neutral-200">
                                  Status: {ord.status.replace(/_/g, ' ')}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onReorder(ord)}
                                    className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-white/15 text-xs font-semibold flex items-center gap-1 hover:bg-neutral-200/70 dark:hover:bg-white/10 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reorder</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onTrackOrder(ord)}
                                    className="px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold cursor-pointer"
                                  >
                                    Track
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'address' && (
                    <form onSubmit={handleSaveAddress} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Default Mobile / WhatsApp</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="03XX-XXXXXXX"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Default Karachi Area</label>
                        <select
                          value={defaultArea}
                          onChange={(e) => setDefaultArea(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm"
                        >
                          {KARACHI_AREAS.map((a) => (
                            <option key={a.id} value={a.name}>
                              {a.name} ({a.zone})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Street / House Address</label>
                        <textarea
                          rows={3}
                          value={defaultAddress}
                          onChange={(e) => setDefaultAddress(e.target.value)}
                          placeholder="House / Flat number, street, block or phase..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-[#111113] text-sm resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {savedNotice && <Check className="w-4 h-4" />}
                        <span>{saving ? 'Saving...' : savedNotice ? 'Saved' : 'Save Preferences'}</span>
                      </button>
                    </form>
                  )}

                  {tab === 'favorites' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {favoriteItems.length === 0 ? (
                        <div className="col-span-full text-center py-10 space-y-2">
                          <Heart className="w-8 h-8 mx-auto text-neutral-400" />
                          <p className="font-display text-xl font-semibold">No saved dishes yet</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Tap the heart icon on any dish to keep it here for quick ordering.
                          </p>
                        </div>
                      ) : (
                        favoriteItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#1B1B1E]"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              className="w-16 h-16 rounded-lg object-cover shrink-0 bg-neutral-200 dark:bg-neutral-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                              <p className="font-mono-num text-xs font-bold text-neutral-900 dark:text-neutral-200 mt-0.5">
                                {formatRs(item.price)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onAddFavoriteToCart(item)}
                              aria-label={`Add ${item.name} to cart`}
                              className="p-2 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 cursor-pointer shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
