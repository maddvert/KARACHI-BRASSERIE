import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { MapPin, PackageCheck, ShoppingBag, Tag, User as UserIcon, UtensilsCrossed, X } from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import { KARACHI_AREAS, KarachiArea } from './data/karachiAreas';
import { MENU_ITEMS, MenuItem } from './data/menuData';
import type {
  CartItem,
  CustomerProfile,
  OrderRecord,
  OrderType,
  PaymentMethod,
} from './types/order';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { FlyToCartLayer, FlyingItem } from './components/FlyToCartLayer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MenuSection } from './components/MenuSection';
import { ExperienceAndFooter } from './components/ExperienceAndFooter';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';

const LocationModal = lazy(() =>
  import('./components/LocationModal').then((m) => ({ default: m.LocationModal }))
);
const CartCheckoutDrawer = lazy(() =>
  import('./components/CartCheckoutDrawer').then((m) => ({ default: m.CartCheckoutDrawer }))
);
const OrderTrackingModal = lazy(() =>
  import('./components/OrderTrackingModal').then((m) => ({ default: m.OrderTrackingModal }))
);
const CustomerDashboardModal = lazy(() =>
  import('./components/CustomerDashboardModal').then((m) => ({ default: m.CustomerDashboardModal }))
);

function MainApp() {
  // Theme state synced with <html>.dark
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('kb_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('kb_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('kb_theme', 'light');
    }
  }, [isDark]);

  // Splash & First-Time Location Prompt (show once per session so reloads stay instant)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kb_splash_seen') !== '1';
    } catch {
      return true;
    }
  });
  const [locationConfigured] = useState<boolean>(
    () => localStorage.getItem('kb_location_configured') === 'true'
  );
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const [orderType, setOrderType] = useState<OrderType>(() => {
    const saved = localStorage.getItem('kb_order_type');
    return saved === 'takeaway' || saved === 'dine-in' ? saved : 'delivery';
  });

  const [selectedArea, setSelectedArea] = useState<KarachiArea>(() => {
    const savedId = localStorage.getItem('kb_area_id');
    return KARACHI_AREAS.find((a) => a.id === savedId) ?? KARACHI_AREAS[0];
  });

  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    try {
      sessionStorage.setItem('kb_splash_seen', '1');
    } catch {
      // ignore
    }
    if (localStorage.getItem('kb_location_configured') !== 'true') {
      setLocationModalOpen(true);
    }
  }, []);

  const handleLocationConfirm = ({
    orderType: nextType,
    area,
    detectedCoords: coords,
  }: {
    orderType: OrderType;
    area: KarachiArea;
    detectedCoords?: { lat: number; lng: number } | null;
  }) => {
    setOrderType(nextType);
    setSelectedArea(area);
    setDetectedCoords(coords ?? null);
    localStorage.setItem('kb_location_configured', 'true');
    localStorage.setItem('kb_order_type', nextType);
    localStorage.setItem('kb_area_id', area.id);
    setLocationModalOpen(false);
  };

  // Cart & Parabolic Fly-to-Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('kb_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('kb_cart', JSON.stringify(cart));
  }, [cart]);

  const [cartOpen, setCartOpen] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [mountedPanels, setMountedPanels] = useState({
    location: false,
    cart: false,
    tracking: false,
    dashboard: false,
  });
  const [flights, setFlights] = useState<FlyingItem[]>([]);
  const [cartJiggle, setCartJiggle] = useState(false);
  const jiggleTimerRef = useRef<number | null>(null);
  const cartBtnRef = useRef<HTMLButtonElement | null>(null);
  const mobileCartBtnRef = useRef<HTMLButtonElement | null>(null);

  const pulseCartButton = useCallback(() => {
    if (jiggleTimerRef.current) {
      window.clearTimeout(jiggleTimerRef.current);
    }
    setCartJiggle(false);
    window.requestAnimationFrame(() => {
      setCartJiggle(true);
      jiggleTimerRef.current = window.setTimeout(() => {
        setCartJiggle(false);
      }, 650);
    });
  }, []);

  const triggerFlyToCart = useCallback(
    (item: MenuItem, imgEl: HTMLImageElement | null) => {
      const targetEl =
        cartBtnRef.current && cartBtnRef.current.offsetParent !== null
          ? cartBtnRef.current
          : mobileCartBtnRef.current;

      if (!imgEl || !targetEl) {
        pulseCartButton();
        return;
      }

      const from = imgEl.getBoundingClientRect();
      const to = targetEl.getBoundingClientRect();
      if (from.width === 0 || to.width === 0) {
        pulseCartButton();
        return;
      }

      const flightId = `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setFlights((prev) => [
        ...prev,
        {
          id: flightId,
          image: item.image,
          name: item.name,
          fromRect: { left: from.left, top: from.top, width: from.width, height: from.height },
          toRect: { left: to.left, top: to.top, width: to.width, height: to.height },
        },
      ]);
    },
    [pulseCartButton]
  );

  const handleFlightComplete = useCallback(
    (id: string) => {
      setFlights((prev) => prev.filter((f) => f.id !== id));
      pulseCartButton();
    },
    [pulseCartButton]
  );

  const handleAddToCart = useCallback(
    (
      item: MenuItem,
      imgEl: HTMLImageElement | null,
      variantLabel?: string,
      overridePrice?: number,
      flavorAddon?: string
    ) => {
      const unitPrice = overridePrice ?? item.price;
      const cartKey = `${item.id}__${variantLabel || 'std'}__${flavorAddon || 'none'}`;

      setCart((prev) => {
        const existing = prev.find((c) => c.cartKey === cartKey);
        if (existing) {
          return prev.map((c) => (c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c));
        }
        return [
          ...prev,
          {
            cartKey,
            id: item.id,
            name: item.name,
            categoryLabel: item.categoryLabel,
            image: item.image,
            unitPrice,
            quantity: 1,
            variantLabel,
            flavorAddon,
          },
        ];
      });

      triggerFlyToCart(item, imgEl);
    },
    [triggerFlyToCart]
  );

  const handleUpdateQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.cartKey === cartKey ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveItem = (cartKey: string) => {
    setCart((prev) => prev.filter((c) => c.cartKey !== cartKey));
  };

  const handleVoiceAddItems = useCallback(
    (matches: { item: MenuItem; quantity: number }[]) => {
      if (matches.length === 0) return;
      setCart((prev) => {
        const next = [...prev];
        for (const { item, quantity } of matches) {
          const defaultVariant = item.variants?.[0];
          const unitPrice = defaultVariant ? defaultVariant.price : item.price;
          const cartKey = `${item.id}__${defaultVariant?.label || 'std'}__none`;
          const idx = next.findIndex((c) => c.cartKey === cartKey);
          if (idx >= 0) {
            next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          } else {
            next.push({
              cartKey,
              id: item.id,
              name: item.name,
              categoryLabel: item.categoryLabel,
              image: item.image,
              unitPrice,
              quantity,
              variantLabel: defaultVariant?.label,
            });
          }
        }
        return next;
      });
      pulseCartButton();
    },
    [pulseCartButton]
  );

  // Firebase Authentication & Customer Data
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    setMountedPanels((prev) => {
      const nextLocation = prev.location || locationModalOpen;
      const nextCart = prev.cart || cartOpen;
      const nextTracking = prev.tracking || Boolean(trackedOrder);
      const nextDashboard = prev.dashboard || dashboardOpen;
      if (
        nextLocation === prev.location &&
        nextCart === prev.cart &&
        nextTracking === prev.tracking &&
        nextDashboard === prev.dashboard
      ) {
        return prev;
      }
      return {
        location: nextLocation,
        cart: nextCart,
        tracking: nextTracking,
        dashboard: nextDashboard,
      };
    });
  }, [locationModalOpen, cartOpen, trackedOrder, dashboardOpen]);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<OrderRecord | null>(() => {
    try {
      const raw = sessionStorage.getItem('kb_last_order');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [authToast, setAuthToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setAuthToast(msg);
    window.setTimeout(() => setAuthToast(null), 3200);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setOrders([]);
        setFavoriteIds(new Set());
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const newProfile: CustomerProfile = {
            uid: currentUser.uid,
            email: currentUser.email || 'customer@karachibrasserie.pk',
            displayName: currentUser.displayName || 'Karachi Guest',
            photoURL: currentUser.photoURL || undefined,
          };
          await setDoc(userRef, {
            uid: newProfile.uid,
            email: newProfile.email,
            displayName: newProfile.displayName,
            ...(newProfile.photoURL ? { photoURL: newProfile.photoURL } : {}),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setProfile(newProfile);
        } else {
          const d = snap.data();
          setProfile({
            uid: d.uid,
            email: d.email,
            displayName: d.displayName,
            photoURL: d.photoURL,
            phone: d.phone,
            defaultArea: d.defaultArea,
            defaultAddress: d.defaultAddress,
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
      }
    });

    return () => unsub();
  }, []);

  // Subscribe to favorites & orders when authenticated
  useEffect(() => {
    if (!user) return;

    const favPath = `users/${user.uid}/favorites`;
    const unsubFavs = onSnapshot(
      collection(db, 'users', user.uid, 'favorites'),
      (snap) => {
        const next = new Set<string>();
        snap.forEach((d) => next.add(d.id));
        setFavoriteIds(next);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, favPath)
    );

    const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const list: OrderRecord[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const createdIso = data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
          const updatedIso = data.updatedAt?.toDate
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
          list.push({
            orderId: data.orderId,
            userId: data.userId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            orderType: data.orderType,
            areaName: data.areaName,
            deliveryAddress: data.deliveryAddress,
            distanceKm: data.distanceKm,
            deliveryFee: data.deliveryFee,
            subtotal: data.subtotal,
            total: data.total,
            paymentMethod: data.paymentMethod,
            status: data.status,
            items: data.items || [],
            notes: data.notes,
            createdAtIso: createdIso,
            updatedAtIso: updatedIso,
          });
        });
        list.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
        setOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    return () => {
      unsubFavs();
      unsubOrders();
    };
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in with Google');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        showToast('Google Sign-In could not complete. Please allow popups and try again.');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setDashboardOpen(false);
    showToast('Signed out');
  };

  const handleSaveProfile = async (updates: {
    phone: string;
    defaultArea: string;
    defaultAddress: string;
  }) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phone: updates.phone.slice(0, 24),
        defaultArea: updates.defaultArea.slice(0, 80),
        defaultAddress: updates.defaultAddress.slice(0, 300),
        updatedAt: serverTimestamp(),
      });
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleToggleFavorite = async (item: MenuItem) => {
    if (!user) {
      setDashboardOpen(true);
      showToast('Sign in with Google to save favourite dishes');
      return;
    }

    const favPath = `users/${user.uid}/favorites/${item.id}`;
    const favRef = doc(db, 'users', user.uid, 'favorites', item.id);
    try {
      if (favoriteIds.has(item.id)) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          userId: user.uid,
          itemId: item.id,
          itemName: item.name.slice(0, 120),
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, favPath);
    }
  };

  const handlePlaceOrder = async (payload: {
    customerName: string;
    customerPhone: string;
    orderType: OrderType;
    areaName: string;
    deliveryAddress: string;
    distanceKm: number;
    deliveryFee: number;
    paymentMethod: PaymentMethod;
    notes: string;
  }): Promise<OrderRecord> => {
    const orderItems = cart.map((c) => ({
      id: c.id,
      name: c.name,
      categoryLabel: c.categoryLabel,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      ...(c.variantLabel ? { variantLabel: c.variantLabel } : {}),
      ...(c.flavorAddon ? { flavorAddon: c.flavorAddon } : {}),
    }));

    const orderId = `KB-${Math.floor(100000 + Math.random() * 899999)}`;

    // Authoritative server order creation (computes petrol-indexed delivery fee)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        userId: user?.uid || 'guest',
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerEmail: user?.email || undefined,
        orderType: payload.orderType,
        areaId: selectedArea.id,
        areaName: payload.areaName,
        deliveryAddress: payload.deliveryAddress,
        distanceKm: payload.distanceKm,
        paymentMethod: payload.paymentMethod,
        items: orderItems,
        notes: payload.notes,
      }),
    });

    if (!res.ok) {
      throw new Error('Could not submit your order. Please try again.');
    }

    const data = await res.json();
    const confirmedOrder: OrderRecord = data.order;

    // Persist in Firestore for signed-in Google customers
    if (user && user.emailVerified) {
      const firestorePath = `orders/${confirmedOrder.orderId}`;
      try {
        await setDoc(doc(db, 'orders', confirmedOrder.orderId), {
          orderId: confirmedOrder.orderId,
          userId: user.uid,
          customerName: confirmedOrder.customerName,
          customerPhone: confirmedOrder.customerPhone,
          ...(confirmedOrder.customerEmail ? { customerEmail: confirmedOrder.customerEmail } : {}),
          orderType: confirmedOrder.orderType,
          areaName: confirmedOrder.areaName || 'Saddar',
          deliveryAddress: confirmedOrder.deliveryAddress || '',
          distanceKm: confirmedOrder.distanceKm ?? 0,
          deliveryFee: confirmedOrder.deliveryFee,
          subtotal: confirmedOrder.subtotal,
          total: confirmedOrder.total,
          paymentMethod: confirmedOrder.paymentMethod,
          status: 'confirmed',
          items: orderItems,
          ...(confirmedOrder.notes ? { notes: confirmedOrder.notes } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, firestorePath);
      }
    }

    return confirmedOrder;
  };

  const handleOrderSuccess = (order: OrderRecord) => {
    setCart([]);
    setCartOpen(false);
    setLastPlacedOrder(order);
    try {
      sessionStorage.setItem('kb_last_order', JSON.stringify(order));
    } catch {
      // ignore storage quota
    }
    setTrackedOrder(order);
  };

  const handleReorder = (ord: OrderRecord) => {
    const nextCart: CartItem[] = [];
    for (const item of ord.items) {
      const catalogItem = MENU_ITEMS.find((m) => m.id === item.id);
      if (!catalogItem) continue;
      nextCart.push({
        cartKey: `${item.id}__${item.variantLabel || 'std'}__${item.flavorAddon || 'none'}`,
        id: item.id,
        name: item.name,
        categoryLabel: item.categoryLabel,
        image: catalogItem.image,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        variantLabel: item.variantLabel,
        flavorAddon: item.flavorAddon,
      });
    }
    setCart(nextCart);
    setDashboardOpen(false);
    setCartOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartItemIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);
  const cartQtyByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) {
      map.set(item.cartKey, item.quantity);
    }
    return map;
  }, [cart]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F5] dark:bg-[#0D0D0E] text-neutral-950 dark:text-neutral-100 transition-colors duration-300 overflow-x-clip">
      <SplashScreen visible={showSplash} isDark={isDark} onComplete={handleSplashComplete} />

      <FlyToCartLayer flights={flights} onFlightComplete={handleFlightComplete} />

      <Suspense fallback={null}>
        {(locationModalOpen || mountedPanels.location) && (
          <LocationModal
            open={locationModalOpen}
            isDark={isDark}
            canDismiss={locationConfigured || true}
            orderType={orderType}
            selectedArea={selectedArea}
            onClose={() => {
              localStorage.setItem('kb_location_configured', 'true');
              setLocationModalOpen(false);
            }}
            onConfirm={handleLocationConfirm}
          />
        )}
      </Suspense>

      {/* Slim Dismissible Promotional Banner Showcasing Running Deals & Discounts */}
      {showPromoBanner && (
        <div className="relative z-40 w-full h-9 sm:h-10 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-b border-white/10 dark:border-black/10 px-3 sm:px-6 flex items-center justify-center">
          <div className="max-w-7xl w-full flex items-center justify-between gap-2.5 text-[11px] sm:text-xs font-medium">
            <span className="hidden sm:inline-flex items-center gap-1 shrink-0 text-neutral-300 dark:text-neutral-600 font-semibold">
              <Tag className="w-3.5 h-3.5" />
              <span>Today&apos;s Deal</span>
            </span>
            <p className="truncate text-center flex-1">
              <strong>20% OFF</strong> All-Day Burger &amp; Wood-Fired Pizza Combos + Free Saddar Delivery over Rs. 2,000.{' '}
              <a
                href="#menu"
                className="underline underline-offset-2 font-semibold hover:opacity-80 ml-1"
              >
                Claim Deal
              </a>
            </p>
            <button
              type="button"
              onClick={() => setShowPromoBanner(false)}
              aria-label="Dismiss promotional banner"
              className="p-1 rounded-md hover:bg-white/15 dark:hover:bg-black/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        cartCount={totalCartCount}
        cartJiggle={cartJiggle}
        cartBtnRef={cartBtnRef}
        onOpenCart={() => setCartOpen(true)}
        user={user}
        onGoogleLogin={handleGoogleLogin}
        onOpenDashboard={() => setDashboardOpen(true)}
      />

      <main className="flex-1">
        <HeroSection
          isDark={isDark}
          orderType={orderType}
          selectedArea={selectedArea}
          cartItemIds={cartItemIds}
          onOpenLocationModal={() => setLocationModalOpen(true)}
          onQuickAdd={(item, imgEl) => handleAddToCart(item, imgEl)}
        />

        <MenuSection
          favoriteIds={favoriteIds}
          cartQtyByKey={cartQtyByKey}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
        />

        <ExperienceAndFooter
          isDark={isDark}
          onSelectOrderType={(type) => {
            setOrderType(type);
            localStorage.setItem('kb_order_type', type);
            showToast(
              type === 'dine-in'
                ? 'Dine-In mode selected'
                : type === 'takeaway'
                ? 'Express Takeaway mode selected'
                : `Delivery mode selected (${selectedArea.name})`
            );
          }}
          onOpenMenu={() => {
            document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </main>

      {/* Compact Mobile Thumb Navigation Bar (No 3-line Hamburger, < 15% Viewport Height) */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-[#111113]/95 backdrop-blur-md grid grid-cols-4"
      >
        <a
          href="#menu"
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200"
        >
          <UtensilsCrossed className="w-4 h-4 text-neutral-950 dark:text-white" />
          <span>Menu</span>
        </a>
        <button
          type="button"
          onClick={() => setLocationModalOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
        >
          <MapPin className="w-4 h-4 text-neutral-950 dark:text-white" />
          <span className="truncate max-w-[74px]">{orderType === 'delivery' ? selectedArea.name.split(' ')[0] : orderType}</span>
        </button>
        <button
          type="button"
          onClick={() => (user ? setDashboardOpen(true) : handleGoogleLogin())}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
        >
          <UserIcon className="w-4 h-4 text-neutral-950 dark:text-white" />
          <span>{user ? 'Account' : 'Sign In'}</span>
        </button>
        <button
          ref={mobileCartBtnRef}
          type="button"
          onClick={() => setCartOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-neutral-950 dark:text-white cursor-pointer ${
            cartJiggle ? 'animate-cart-jiggle' : ''
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cart ({totalCartCount})</span>
        </button>
      </nav>

      {/* Drawers & Modals (Code-Split via React.lazy for Fast Initial Load) */}
      <Suspense fallback={null}>
        {(cartOpen || mountedPanels.cart) && (
          <CartCheckoutDrawer
            open={cartOpen}
            items={cart}
            orderType={orderType}
            selectedArea={selectedArea}
            detectedCoords={detectedCoords}
            user={user}
            profile={profile}
            onClose={() => setCartOpen(false)}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onVoiceAddItems={handleVoiceAddItems}
            onChangeOrderType={(nextType) => {
              setOrderType(nextType);
              localStorage.setItem('kb_order_type', nextType);
            }}
            onChangeArea={(area, coords) => {
              setSelectedArea(area);
              setDetectedCoords(coords ?? null);
              localStorage.setItem('kb_area_id', area.id);
            }}
            onPlaceOrder={handlePlaceOrder}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {(trackedOrder || mountedPanels.tracking) && (
          <OrderTrackingModal order={trackedOrder} onClose={() => setTrackedOrder(null)} />
        )}

        {(dashboardOpen || mountedPanels.dashboard) && (
          <CustomerDashboardModal
            open={dashboardOpen}
            user={user}
            profile={profile}
            orders={orders}
            favoriteIds={favoriteIds}
            onClose={() => setDashboardOpen(false)}
            onGoogleLogin={handleGoogleLogin}
            onSignOut={handleSignOut}
            onSaveProfile={handleSaveProfile}
            onTrackOrder={(ord) => {
              setDashboardOpen(false);
              setTrackedOrder(ord);
            }}
            onReorder={handleReorder}
            onAddFavoriteToCart={(item) => {
              handleAddToCart(item, null);
              showToast(`Added ${item.name} to cart`);
            }}
          />
        )}
      </Suspense>

      <FloatingWhatsApp
        autoExpandWaitTime={true}
        activeOrderId={lastPlacedOrder?.orderId ?? null}
        onOpenOrderTracking={() => {
          if (lastPlacedOrder) {
            setTrackedOrder(lastPlacedOrder);
          }
        }}
      />

      {/* Post-Order Floating Live Tracking Trigger (Shown ONLY after an order is placed) */}
      {lastPlacedOrder && !trackedOrder && (
        <button
          type="button"
          onClick={() => setTrackedOrder(lastPlacedOrder)}
          className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs sm:text-sm font-semibold shadow-xl border border-white/15 dark:border-black/15 hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer"
        >
          <PackageCheck className="w-4 h-4 shrink-0" />
          <span className="font-mono-num">Track #{lastPlacedOrder.orderId}</span>
        </button>
      )}

      {/* Subtle Toast Notice */}
      {authToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[95] px-4 py-2.5 rounded-xl bg-[#181414] dark:bg-white text-white dark:text-[#181414] text-xs font-semibold shadow-xl">
          {authToast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
