// ============================================================
// Core Types — POS Kasir
// ============================================================

// --- Auth & User ---
export type Role = 'cashier' | 'manager' | 'admin';

export interface Permission {
  'pos.view': boolean;
  'pos.create': boolean;
  'pos.payment': boolean;
  'pos.discount': boolean;
  'pos.void': boolean;
  'pos.refund': boolean;
  'pos.hold': boolean;
  'pos.recall': boolean;
  'pos.reprint': boolean;
  'pos.close_shift': boolean;
  'cash.view': boolean;
  'cash.in': boolean;
  'cash.out': boolean;
  'cash.reconcile': boolean;
  'return.create': boolean;
  'return.approve': boolean;
  'return.refund': boolean;
  'inventory.view': boolean;
  'inventory.sales_deduction': boolean;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: Role;
  storeId: string;
  storeName: string;
  terminalId: string;
  permissions: Partial<Permission>;
  isActive: boolean;
}

// --- Store & Terminal ---
export interface Store {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
}

export interface Terminal {
  id: string;
  code: string;
  storeId: string;
  name: string;
  isActive: boolean;
}

// --- Shift ---
export type ShiftStatus = 'OPEN' | 'CLOSING' | 'CLOSED' | 'RECONCILIATION';

export interface Shift {
  id: string;
  employeeId: string;
  storeId: string;
  terminalId: string;
  openingCash: number;
  openingTime: string;
  closingTime?: string;
  status: ShiftStatus;
  actualCash?: number;
  variance?: number;
}

// --- Product ---
export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  sellingPrice: number;
  tax: number;
  hasPromotion: boolean;
  stock: number;
  isWeightBased: boolean;
  status: 'active' | 'inactive';
  imageUrl?: string;
}

// --- Cart ---
export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
  discountType: 'percentage' | 'nominal';
  tax: number;
  subtotal: number;
  promotionApplied?: string;
}

// --- Promotion ---
export type PromotionType =
  | 'DISCOUNT_PERCENTAGE'
  | 'DISCOUNT_NOMINAL'
  | 'BUY_X_GET_Y'
  | 'BUY_1_GET_1'
  | 'BUNDLING'
  | 'MEMBER_PRICE';

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  value: number;
  minQty?: number;
  minPurchase?: number;
  productIds: string[];
  categoryIds: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// --- Member / Customer ---
export type MemberLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  memberLevel: MemberLevel;
  point: number;
  vouchers: Voucher[];
}

export interface Voucher {
  id: string;
  code: string;
  value: number;
  type: 'percentage' | 'nominal';
  expiryDate: string;
}

// --- Payment ---
export type PaymentMethod = 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT' | 'EWALLET' | 'TRANSFER';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  id: string;
  transactionId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  reference?: string;
}

// --- Transaction ---
export type TransactionStatus =
  | 'COMPLETED'
  | 'PENDING_SYNC'
  | 'SYNCED'
  | 'VOIDED'
  | 'RETURNED'
  | 'PARTIALLY_RETURNED';

export interface Transaction {
  id: string;
  shiftId: string;
  storeId: string;
  terminalId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  payments: Payment[];
  change: number;
  status: TransactionStatus;
  createdAt: string;
  completedAt?: string;
  idempotencyKey: string;
}

// --- Hold Transaction ---
export interface HoldTransaction {
  id: string;
  label: string;
  items: CartItem[];
  customer?: Customer;
  createdAt: string;
}

// --- Void ---
export interface VoidRequest {
  id: string;
  transactionId: string;
  productId?: string;
  productName?: string;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

// --- Return ---
export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface ReturnRequest {
  id: string;
  originalTransactionId: string;
  items: ReturnItem[];
  reason: string;
  refundAmount: number;
  refundMethod: PaymentMethod;
  cashierId: string;
  approverId?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

// --- Cash Movement ---
export type CashMovementType = 'CASH_IN' | 'CASH_OUT';

export interface CashMovement {
  id: string;
  shiftId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  userId: string;
  approvedBy?: string;
  createdAt: string;
}

// --- Sync ---
export type SyncStatus = 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
export type SyncType = 'SALE' | 'VOID' | 'RETURN' | 'SHIFT' | 'CASH_MOVEMENT';

export interface SyncQueueItem {
  id: string;
  type: SyncType;
  referenceId: string;
  status: SyncStatus;
  retryCount: number;
  createdAt: string;
  lastAttempt?: string;
}

// --- Audit Log ---
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'OPEN_SHIFT'
  | 'CLOSE_SHIFT'
  | 'CREATE_SALE'
  | 'PAYMENT'
  | 'VOID'
  | 'RETURN'
  | 'DISCOUNT_OVERRIDE'
  | 'CASH_IN'
  | 'CASH_OUT'
  | 'REPRINT_RECEIPT'
  | 'SYNC'
  | 'APPROVAL';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  approvedBy?: string;
  terminalId: string;
  storeId: string;
  createdAt: string;
}

// --- Navigation ---
export type RootStackParamList = {
  Login: undefined;
  OpenShift: undefined;
  Main: undefined;
  Payment: { total: number };
  TransactionHistory: undefined;
  TransactionDetail: { transactionId: string };
  Hold: undefined;
  Recall: undefined;
  Void: { transactionId?: string };
  Return: { transactionId?: string };
  CashManagement: undefined;
  ClosingShift: undefined;
  MemberSearch: undefined;
  ShiftSummary: undefined;
  SyncStatus: undefined;
  ReceiptPreview: { transactionId: string };
};
