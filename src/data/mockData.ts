import {
  User, Product, Customer, Transaction, Shift,
  Promotion, CashMovement, SyncQueueItem,
} from '../types';

// ─── Users ──────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    employeeId: 'KSR001',
    name: 'Andi Kasir',
    role: 'cashier',
    storeId: 'BLT001',
    storeName: 'Toko Belitung 01',
    terminalId: 'POS-01',
    isActive: true,
    permissions: {
      'pos.view': true,
      'pos.create': true,
      'pos.payment': true,
      'pos.discount': true,
      'pos.void': false,
      'pos.refund': false,
      'pos.hold': true,
      'pos.recall': true,
      'pos.reprint': true,
      'pos.close_shift': true,
      'cash.view': true,
      'cash.in': false,
      'cash.out': false,
      'cash.reconcile': false,
      'return.create': true,
      'return.approve': false,
      'return.refund': false,
      'inventory.view': false,
      'inventory.sales_deduction': true,
    },
  },
  {
    id: 'u2',
    employeeId: 'MGR001',
    name: 'Budi Manager',
    role: 'manager',
    storeId: 'BLT001',
    storeName: 'Toko Belitung 01',
    terminalId: 'POS-01',
    isActive: true,
    permissions: {
      'pos.view': true,
      'pos.create': true,
      'pos.payment': true,
      'pos.discount': true,
      'pos.void': true,
      'pos.refund': true,
      'pos.hold': true,
      'pos.recall': true,
      'pos.reprint': true,
      'pos.close_shift': true,
      'cash.view': true,
      'cash.in': true,
      'cash.out': true,
      'cash.reconcile': true,
      'return.create': true,
      'return.approve': true,
      'return.refund': true,
      'inventory.view': true,
      'inventory.sales_deduction': true,
    },
  },
];

// ─── Products ──────────────────────────────────────────────
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1', sku: 'SKU-001', barcode: '8992761143703',
    name: 'Indomie Goreng', category: 'Mie Instan', unit: 'pcs',
    sellingPrice: 3500, tax: 0, hasPromotion: false, stock: 150,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p2', sku: 'SKU-002', barcode: '8999999012345',
    name: 'Aqua 600ml', category: 'Air Minum', unit: 'botol',
    sellingPrice: 4000, tax: 0, hasPromotion: true, stock: 80,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p3', sku: 'SKU-003', barcode: '8850387172008',
    name: 'Roti Tawar Sari Roti', category: 'Roti', unit: 'bungkus',
    sellingPrice: 15000, tax: 0, hasPromotion: false, stock: 25,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p4', sku: 'SKU-004', barcode: '8886389100016',
    name: 'Teh Botol Sosro 450ml', category: 'Minuman', unit: 'botol',
    sellingPrice: 5000, tax: 0, hasPromotion: false, stock: 60,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p5', sku: 'SKU-005', barcode: '8886012100177',
    name: 'Pocari Sweat 350ml', category: 'Minuman', unit: 'botol',
    sellingPrice: 8000, tax: 0, hasPromotion: false, stock: 45,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p6', sku: 'SKU-006', barcode: '8888888600022',
    name: 'Chitato Original 68g', category: 'Snack', unit: 'bungkus',
    sellingPrice: 11000, tax: 0, hasPromotion: false, stock: 30,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p7', sku: 'SKU-007', barcode: '8991001304248',
    name: 'Milo 200ml', category: 'Minuman', unit: 'kotak',
    sellingPrice: 6500, tax: 0, hasPromotion: true, stock: 55,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p8', sku: 'SKU-008', barcode: '8998787011042',
    name: 'Good Day Cappucino', category: 'Kopi', unit: 'sachet',
    sellingPrice: 2000, tax: 0, hasPromotion: false, stock: 200,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p9', sku: 'SKU-009', barcode: '8999999087654',
    name: 'Sabun Lifebuoy 85g', category: 'Kebersihan', unit: 'pcs',
    sellingPrice: 7500, tax: 0, hasPromotion: false, stock: 40,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p10', sku: 'SKU-010', barcode: '8991234500001',
    name: 'Daging Sapi (per 100g)', category: 'Daging', unit: 'gram',
    sellingPrice: 15000, tax: 0, hasPromotion: false, stock: 5000,
    isWeightBased: true, status: 'active',
  },
  {
    id: 'p11', sku: 'SKU-011', barcode: '8990099011203',
    name: 'Sunlight Jeruk 800ml', category: 'Kebersihan', unit: 'botol',
    sellingPrice: 18500, tax: 0, hasPromotion: false, stock: 20,
    isWeightBased: false, status: 'active',
  },
  {
    id: 'p12', sku: 'SKU-012', barcode: '8992002200021',
    name: 'Pepsodent 190g', category: 'Kebersihan', unit: 'pcs',
    sellingPrice: 14500, tax: 0, hasPromotion: false, stock: 35,
    isWeightBased: false, status: 'active',
  },
];

// ─── Promotions ─────────────────────────────────────────────
export const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 'promo1',
    name: 'Aqua 3 pcs = Rp10.000',
    type: 'DISCOUNT_NOMINAL',
    value: 2000,
    minQty: 3,
    productIds: ['p2'],
    categoryIds: [],
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    isActive: true,
  },
  {
    id: 'promo2',
    name: 'Buy 2 Milo Get 1 Free',
    type: 'BUY_X_GET_Y',
    value: 1,
    minQty: 2,
    productIds: ['p7'],
    categoryIds: [],
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    isActive: true,
  },
];

// ─── Customers ──────────────────────────────────────────────
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Siti Rahayu',
    phone: '08123456789',
    memberLevel: 'GOLD',
    point: 1250,
    vouchers: [
      { id: 'v1', code: 'DISC10', value: 10, type: 'percentage', expiryDate: '2026-12-31' },
    ],
  },
  {
    id: 'c2',
    name: 'Budi Santoso',
    phone: '08987654321',
    memberLevel: 'SILVER',
    point: 480,
    vouchers: [],
  },
  {
    id: 'c3',
    name: 'Dewi Lestari',
    phone: '08111222333',
    memberLevel: 'BRONZE',
    point: 120,
    vouchers: [],
  },
];

// ─── Transactions ───────────────────────────────────────────
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-BLT001-POS01-20260901-000001',
    shiftId: 'SHF-001',
    storeId: 'BLT001',
    terminalId: 'POS-01',
    cashierId: 'u1',
    cashierName: 'Andi Kasir',
    customerId: 'c1',
    customerName: 'Siti Rahayu',
    items: [
      {
        productId: 'p1', productName: 'Indomie Goreng',
        sku: 'SKU-001', price: 3500, quantity: 5,
        discount: 0, discountType: 'nominal', tax: 0, subtotal: 17500,
      },
      {
        productId: 'p2', productName: 'Aqua 600ml',
        sku: 'SKU-002', price: 4000, quantity: 3,
        discount: 2000, discountType: 'nominal', tax: 0, subtotal: 10000,
        promotionApplied: 'Aqua 3 pcs = Rp10.000',
      },
    ],
    subtotal: 29500, discountTotal: 2000, taxTotal: 0, total: 27500,
    payments: [{ id: 'pay1', transactionId: 'TRX-BLT001-POS01-20260901-000001', method: 'CASH', amount: 30000, status: 'SUCCESS' }],
    change: 2500,
    status: 'SYNCED',
    createdAt: '2026-09-01T09:15:00Z',
    completedAt: '2026-09-01T09:16:30Z',
    idempotencyKey: 'POS01-TRX-20260901-000001',
  },
  {
    id: 'TRX-BLT001-POS01-20260901-000002',
    shiftId: 'SHF-001',
    storeId: 'BLT001',
    terminalId: 'POS-01',
    cashierId: 'u1',
    cashierName: 'Andi Kasir',
    items: [
      {
        productId: 'p4', productName: 'Teh Botol Sosro 450ml',
        sku: 'SKU-004', price: 5000, quantity: 2,
        discount: 0, discountType: 'nominal', tax: 0, subtotal: 10000,
      },
      {
        productId: 'p6', productName: 'Chitato Original 68g',
        sku: 'SKU-006', price: 11000, quantity: 1,
        discount: 0, discountType: 'nominal', tax: 0, subtotal: 11000,
      },
    ],
    subtotal: 21000, discountTotal: 0, taxTotal: 0, total: 21000,
    payments: [
      { id: 'pay2a', transactionId: 'TRX-BLT001-POS01-20260901-000002', method: 'CASH', amount: 11000, status: 'SUCCESS' },
      { id: 'pay2b', transactionId: 'TRX-BLT001-POS01-20260901-000002', method: 'QRIS', amount: 10000, status: 'SUCCESS' },
    ],
    change: 0,
    status: 'PENDING_SYNC',
    createdAt: '2026-09-01T10:30:00Z',
    completedAt: '2026-09-01T10:31:00Z',
    idempotencyKey: 'POS01-TRX-20260901-000002',
  },
];

// ─── Shift ──────────────────────────────────────────────────
export const MOCK_SHIFT: Shift = {
  id: 'SHF-001',
  employeeId: 'u1',
  storeId: 'BLT001',
  terminalId: 'POS-01',
  openingCash: 500000,
  openingTime: '2026-09-01T08:00:00Z',
  status: 'OPEN',
};

// ─── Cash Movements ─────────────────────────────────────────
export const MOCK_CASH_MOVEMENTS: CashMovement[] = [
  {
    id: 'cm1', shiftId: 'SHF-001', type: 'CASH_IN',
    amount: 200000, reason: 'Tambahan kas awal',
    userId: 'u2', createdAt: '2026-09-01T08:30:00Z',
  },
];

// ─── Sync Queue ─────────────────────────────────────────────
export const MOCK_SYNC_QUEUE: SyncQueueItem[] = [
  { id: 'sq1', type: 'SALE', referenceId: 'TRX-BLT001-POS01-20260901-000001', status: 'SYNCED', retryCount: 0, createdAt: '2026-09-01T09:16:30Z' },
  { id: 'sq2', type: 'SALE', referenceId: 'TRX-BLT001-POS01-20260901-000002', status: 'PENDING', retryCount: 1, createdAt: '2026-09-01T10:31:00Z', lastAttempt: '2026-09-01T10:35:00Z' },
];
