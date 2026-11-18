export type OrderType = 'delivery' | 'takeaway' | 'dine-in';

export type OrderStatus = 'confirmed' | 'preparing' | 'out_for_delivery' | 'ready' | 'completed';

export type PaymentMethod = 'cash_on_delivery' | 'card_on_delivery' | 'pay_at_counter';

export interface CartItem {
  cartKey: string;
  id: string;
  name: string;
  categoryLabel: string;
  image: string;
  unitPrice: number;
  quantity: number;
  variantLabel?: string;
  flavorAddon?: string;
}

export interface OrderLineItem {
  id: string;
  name: string;
  categoryLabel: string;
  quantity: number;
  unitPrice: number;
  variantLabel?: string;
  flavorAddon?: string;
}

export interface OrderRecord {
  orderId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: OrderType;
  areaName?: string;
  deliveryAddress?: string;
  distanceKm?: number;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  items: OrderLineItem[];
  notes?: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface CustomerProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  defaultArea?: string;
  defaultAddress?: string;
}

export interface DeliveryQuote {
  areaId: string;
  areaName: string;
  distanceKm: number;
  deliveryFee: number;
  estimatedMinutes: number;
}
