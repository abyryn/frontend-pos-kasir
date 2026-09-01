# POS Kasir — React Native

Aplikasi Point of Sale (POS) berbasis **React Native + Expo** yang dibangun sesuai PRD dan design system ERP POS.

---

## Stack

| Library | Versi | Kegunaan |
|---|---|---|
| Expo | ~51 | Runtime & toolchain |
| React Native | 0.74 | UI framework |
| Zustand | ^4 | State management |
| React Navigation | ^6 | Navigation |
| Lucide React Native | ^0.378 | Icons |
| AsyncStorage | 1.23 | Local persistence |
| date-fns | ^3 | Date formatting |

---

## Cara Menjalankan

### Prasyarat
- Node.js ≥ 18
- npm atau yarn
- Expo CLI: `npm install -g expo-cli`

### Install & Run

```bash
cd pos-kasir
npm install
npm start          # Expo dev server
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Browser (untuk development)
```

### Demo Login
| Role    | Employee ID | PIN  |
|---------|-------------|------|
| Kasir   | `KSR001`    | `1234` |
| Manager | `MGR001`    | `0000` |

---

## Struktur Project

```
pos-kasir/
├── App.tsx                        # Entry point
├── src/
│   ├── theme/                     # Design system tokens
│   │   ├── colors.ts              # Color palette (sky blue + semantic)
│   │   ├── typography.ts          # Font size, weight
│   │   ├── spacing.ts             # Spacing, radius, shadow
│   │   └── index.ts
│   │
│   ├── types/
│   │   └── index.ts               # All TypeScript interfaces
│   │
│   ├── data/
│   │   └── mockData.ts            # Mock products, users, transactions
│   │
│   ├── store/                     # Zustand state management
│   │   ├── useAuthStore.ts        # Auth, shift, permissions
│   │   ├── useCartStore.ts        # Cart items, hold/recall
│   │   └── useTransactionStore.ts # Transactions, void, return, cash
│   │
│   ├── components/
│   │   ├── ui/                    # Reusable base components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── StatusBar.tsx      # POS top bar
│   │   └── pos/                   # POS-specific components
│   │       ├── ProductCard.tsx
│   │       ├── CartItem.tsx
│   │       └── DiscountModal.tsx
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx        # PIN login, two-panel
│   │   ├── OpenShiftScreen.tsx    # Opening cash, shift info
│   │   ├── SalesScreen.tsx        # Main POS (product grid + cart)
│   │   ├── PaymentScreen.tsx      # Cash / QRIS / split payment
│   │   ├── ReceiptScreen.tsx      # Transaction success + receipt
│   │   ├── TransactionHistoryScreen.tsx
│   │   ├── HoldRecallScreen.tsx
│   │   ├── VoidScreen.tsx
│   │   ├── ReturnScreen.tsx
│   │   ├── CashManagementScreen.tsx
│   │   ├── ClosingShiftScreen.tsx
│   │   └── MemberSearchScreen.tsx
│   │
│   └── navigation/
│       └── AppNavigator.tsx       # State-machine navigator
```

---

## Fitur

### Phase 1 — Core (MVP) ✅
- [x] Login dengan Employee ID + PIN pad
- [x] Open shift dengan kas awal
- [x] Product grid dengan search & category filter
- [x] Barcode scan (input manual/enter)
- [x] Cart dengan qty control
- [x] Cash payment + kembalian otomatis
- [x] Struk transaksi
- [x] Riwayat transaksi
- [x] Closing shift + variance calculation
- [x] Hold / Recall transaksi

### Phase 2 — Retail ✅
- [x] QRIS & split payment
- [x] Member / customer search
- [x] Diskon item & cart (% dan nominal)
- [x] Void transaksi (+ approval flow)
- [x] Retur produk (+ approval flow)
- [x] Cash In / Cash Out
- [x] Cetak ulang struk

### Phase 3 — Enterprise (Ready for integration)
- [ ] SQLite local database
- [ ] Offline sync queue
- [ ] REST API integration
- [ ] Hardware (printer, cash drawer, barcode scanner)
- [ ] Multi-terminal support
- [ ] Push notifications

---

## Design System

Mengikuti `design.md` — Sky Blue Enterprise System:

```
Primary:     #0EA5E9  (Sky 500)
Background:  #F8FAFC  (Gray 50)
Surface:     #FFFFFF
Text:        #0F172A  (Gray 900)
Border:      #E2E8F0  (Gray 200)
Success:     #22C55E
Warning:     #F59E0B
Danger:      #EF4444
```

Font: Inter / System UI  
Radius: 10px (button/input) → 20px (modal)  
Shadow: Soft, minimal

---

## Permission Matrix

| Fitur | Kasir | Manager |
|---|:---:|:---:|
| Login | ✅ | ✅ |
| Open/Close Shift | ✅ | ✅ |
| Transaksi | ✅ | ✅ |
| Diskon | ✅ (≤5%) | ✅ |
| Void | ⚠️ Approval | ✅ |
| Retur | ⚠️ Approval | ✅ |
| Cash In/Out | ⚠️ Approval | ✅ |
| History | ✅ | ✅ |
| Member | ✅ | ✅ |
