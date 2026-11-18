import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  KARACHI_AREAS,
  RESTAURANT_COORDS,
  findNearestKarachiArea,
  haversineKm,
} from './src/data/karachiAreas.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

interface PetrolCache {
  ratePkrPerLitre: number;
  lastFetchedMs: number;
}

const DEFAULT_PAKISTAN_PETROL_PKR = Number(process.env.PETROL_RATE_PKR) || 258;
const petrolCache: PetrolCache = {
  ratePkrPerLitre: DEFAULT_PAKISTAN_PETROL_PKR,
  lastFetchedMs: 0,
};

// Backend-only automatic Pakistan petrol rate sync (cached 6 hours, never exposed to UI)
async function getCurrentPakistanPetrolRate(): Promise<number> {
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  if (Date.now() - petrolCache.lastFetchedMs < SIX_HOURS_MS && petrolCache.lastFetchedMs > 0) {
    return petrolCache.ratePkrPerLitre;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://petrolpricepakistan.pk/', {
      signal: controller.signal,
      headers: { 'User-Agent': 'KarachiBrasserieDispatch/1.0' },
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      // Match realistic Pakistan MS Petrol rate between Rs. 200 and Rs. 400
      const match = html.match(/(?:Petrol|MS)[^0-9]{0,40}(2\d{2}|3\d{2})(?:\.\d{1,2})?/i);
      if (match && match[1]) {
        const parsed = Number(match[1]);
        if (parsed >= 200 && parsed <= 400) {
          petrolCache.ratePkrPerLitre = parsed;
          petrolCache.lastFetchedMs = Date.now();
          return parsed;
        }
      }
    }
  } catch {
    // Silent fallback to configured Pakistan baseline rate
  }

  petrolCache.lastFetchedMs = Date.now();
  return petrolCache.ratePkrPerLitre;
}

function computeDeliveryQuote(distanceKm: number, petrolRatePkr: number): {
  deliveryFee: number;
  estimatedMinutes: number;
} {
  const safeKm = Math.max(1.0, Math.min(45, distanceKm));
  const baseDispatch = petrolRatePkr * 0.25; // Base rider dispatch component
  const perKmCharge = petrolRatePkr * 0.095; // Distance fuel + rider coefficient
  const rawFee = baseDispatch + safeKm * perKmCharge;
  const roundedFee = Math.max(100, Math.round(rawFee / 10) * 10);
  const estimatedMinutes = Math.min(75, Math.max(22, Math.round(18 + safeKm * 2.4)));
  return { deliveryFee: roundedFee, estimatedMinutes };
}

interface StoredOrder {
  orderId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'delivery' | 'takeaway' | 'dine-in';
  areaName?: string;
  deliveryAddress?: string;
  distanceKm?: number;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: 'cash_on_delivery' | 'card_on_delivery' | 'pay_at_counter';
  status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'ready' | 'completed';
  items: Array<{
    id: string;
    name: string;
    categoryLabel: string;
    quantity: number;
    unitPrice: number;
    variantLabel?: string;
    flavorAddon?: string;
  }>;
  notes?: string;
  createdAtIso: string;
  updatedAtIso: string;
}

const guestOrders = new Map<string, StoredOrder>();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/detect-area', async (req, res) => {
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: 'Valid coordinates are required.' });
      return;
    }

    const { area, roadDistanceKm } = findNearestKarachiArea(lat, lng);
    const petrolRate = await getCurrentPakistanPetrolRate();
    const quote = computeDeliveryQuote(roadDistanceKm, petrolRate);

    res.json({
      area,
      distanceKm: roadDistanceKm,
      deliveryFee: quote.deliveryFee,
      estimatedMinutes: quote.estimatedMinutes,
    });
  });

  app.post('/api/delivery-quote', async (req, res) => {
    const areaId = typeof req.body?.areaId === 'string' ? req.body.areaId : '';
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    const petrolRate = await getCurrentPakistanPetrolRate();

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const { area, roadDistanceKm } = findNearestKarachiArea(lat, lng);
      const quote = computeDeliveryQuote(roadDistanceKm, petrolRate);
      res.json({
        areaId: area.id,
        areaName: area.name,
        distanceKm: roadDistanceKm,
        deliveryFee: quote.deliveryFee,
        estimatedMinutes: quote.estimatedMinutes,
      });
      return;
    }

    const area = KARACHI_AREAS.find((a) => a.id === areaId) ?? KARACHI_AREAS[0];
    const straightKm = haversineKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, area.lat, area.lng);
    const roadDistanceKm = Math.max(1.2, Number((straightKm * 1.28).toFixed(1)));
    const quote = computeDeliveryQuote(roadDistanceKm, petrolRate);

    res.json({
      areaId: area.id,
      areaName: area.name,
      distanceKm: roadDistanceKm,
      deliveryFee: quote.deliveryFee,
      estimatedMinutes: quote.estimatedMinutes,
    });
  });

  app.post('/api/orders', async (req, res) => {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      res.status(400).json({ error: 'Order items are required.' });
      return;
    }

    const orderType: 'delivery' | 'takeaway' | 'dine-in' =
      payload.orderType === 'takeaway' || payload.orderType === 'dine-in' ? payload.orderType : 'delivery';

    let deliveryFee = 0;
    let distanceKm = 0;
    let areaName = typeof payload.areaName === 'string' ? payload.areaName : 'Saddar / Atrium Mall';

    if (orderType === 'delivery') {
      const petrolRate = await getCurrentPakistanPetrolRate();
      const area = KARACHI_AREAS.find((a) => a.id === payload.areaId || a.name === payload.areaName);
      if (area) {
        const straight = haversineKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, area.lat, area.lng);
        distanceKm = Math.max(1.2, Number((straight * 1.28).toFixed(1)));
        areaName = area.name;
      } else {
        distanceKm = Math.max(1.5, Number(payload.distanceKm) || 4.0);
      }
      deliveryFee = computeDeliveryQuote(distanceKm, petrolRate).deliveryFee;
    }

    const subtotal = payload.items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + Math.max(0, Number(item.unitPrice) || 0) * Math.max(1, Number(item.quantity) || 1),
      0
    );

    const orderId =
      typeof payload.orderId === 'string' && /^[a-zA-Z0-9_-]{4,40}$/.test(payload.orderId)
        ? payload.orderId
        : `KB-${Math.floor(100000 + Math.random() * 899999)}`;

    const nowIso = new Date().toISOString();
    const order: StoredOrder = {
      orderId,
      userId: typeof payload.userId === 'string' && payload.userId ? payload.userId : 'guest',
      customerName: String(payload.customerName || 'Guest').slice(0, 100),
      customerPhone: String(payload.customerPhone || '').slice(0, 24),
      customerEmail: payload.customerEmail ? String(payload.customerEmail).slice(0, 160) : undefined,
      orderType,
      areaName: orderType === 'delivery' ? areaName : 'Hotel Excelsior, Saddar',
      deliveryAddress: orderType === 'delivery' ? String(payload.deliveryAddress || '').slice(0, 320) : RESTAURANT_COORDS.address,
      distanceKm: orderType === 'delivery' ? distanceKm : 0,
      deliveryFee,
      subtotal,
      total: subtotal + deliveryFee,
      paymentMethod:
        payload.paymentMethod === 'card_on_delivery' || payload.paymentMethod === 'pay_at_counter'
          ? payload.paymentMethod
          : 'cash_on_delivery',
      status: 'confirmed',
      items: payload.items.slice(0, 50),
      notes: payload.notes ? String(payload.notes).slice(0, 300) : undefined,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    guestOrders.set(order.orderId, order);
    res.status(201).json({ order });
  });

  app.get('/api/orders/:orderId', (req, res) => {
    const order = guestOrders.get(req.params.orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // Smooth progressive live status simulation based on elapsed time if still active
    const elapsedSec = (Date.now() - new Date(order.createdAtIso).getTime()) / 1000;
    let nextStatus = order.status;
    if (elapsedSec > 90) {
      nextStatus = 'completed';
    } else if (elapsedSec > 45) {
      nextStatus = order.orderType === 'delivery' ? 'out_for_delivery' : 'ready';
    } else if (elapsedSec > 12) {
      nextStatus = 'preparing';
    }
    if (nextStatus !== order.status) {
      order.status = nextStatus;
      order.updatedAtIso = new Date().toISOString();
    }

    res.json({ order });
  });

  app.use(
    '/assets',
    express.static(path.resolve(__dirname, 'public/assets'), {
      maxAge: '7d',
      immutable: true,
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(
        express.static(distDir, {
          maxAge: '7d',
          index: false,
        })
      );
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Karachi Brasserie server listening on http://localhost:${PORT}`);
  });
}

startServer();
