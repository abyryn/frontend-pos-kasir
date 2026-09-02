import { create } from 'zustand';
import { Transaction, VoidRequest, ReturnRequest, CashMovement, SyncQueueItem } from '../types';
import { MOCK_TRANSACTIONS, MOCK_CASH_MOVEMENTS, MOCK_SYNC_QUEUE } from '../data/mockData';

interface TransactionState {
  transactions: Transaction[];
  voidRequests: VoidRequest[];
  returnRequests: ReturnRequest[];
  cashMovements: CashMovement[];
  syncQueue: SyncQueueItem[];

  addTransaction: (tx: Transaction) => void;
  voidTransaction: (txId: string, reason: string, userId: string, needsApproval: boolean) => void;
  approveVoid: (voidId: string, approverId: string) => void;
  requestReturn: (req: Omit<ReturnRequest, 'id' | 'createdAt'>) => void;
  approveReturn: (returnId: string, approverId: string) => void;
  addCashMovement: (movement: Omit<CashMovement, 'id' | 'createdAt'>) => void;
  addToSyncQueue: (type: SyncQueueItem['type'], referenceId: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
}

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: MOCK_TRANSACTIONS,
  voidRequests: [],
  returnRequests: [],
  cashMovements: MOCK_CASH_MOVEMENTS,
  syncQueue: MOCK_SYNC_QUEUE,

  addTransaction: (tx) => {
    set((state) => ({ transactions: [tx, ...state.transactions] }));
    get().addToSyncQueue('SALE', tx.id);
  },

  voidTransaction: (txId, reason, userId, needsApproval) => {
    const voidReq: VoidRequest = {
      id: `void-${Date.now()}`,
      transactionId: txId,
      reason,
      requestedBy: userId,
      status: needsApproval ? 'PENDING_APPROVAL' : 'APPROVED',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ voidRequests: [...state.voidRequests, voidReq] }));

    if (!needsApproval) {
      set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.id === txId ? { ...tx, status: 'VOIDED' } : tx
        ),
      }));
    }
  },

  approveVoid: (voidId, approverId) => {
    set((state) => {
      const voidReq = state.voidRequests.find((v) => v.id === voidId);
      if (!voidReq) return state;
      return {
        voidRequests: state.voidRequests.map((v) =>
          v.id === voidId ? { ...v, status: 'APPROVED', approvedBy: approverId } : v
        ),
        transactions: state.transactions.map((tx) =>
          tx.id === voidReq.transactionId ? { ...tx, status: 'VOIDED' } : tx
        ),
      };
    });
  },

  requestReturn: (req) => {
    const returnReq: ReturnRequest = {
      ...req,
      id: `rtn-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ returnRequests: [...state.returnRequests, returnReq] }));
  },

  approveReturn: (returnId, approverId) => {
    set((state) => {
      const req = state.returnRequests.find((r) => r.id === returnId);
      if (!req) return state;
      return {
        returnRequests: state.returnRequests.map((r) =>
          r.id === returnId ? { ...r, status: 'APPROVED', approverId } : r
        ),
        transactions: state.transactions.map((tx) =>
          tx.id === req.originalTransactionId ? { ...tx, status: 'RETURNED' } : tx
        ),
      };
    });
  },

  addCashMovement: (movement) => {
    const cm: CashMovement = {
      ...movement,
      id: `cm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ cashMovements: [...state.cashMovements, cm] }));
  },

  addToSyncQueue: (type, referenceId) => {
    const item: SyncQueueItem = {
      id: `sq-${Date.now()}`,
      type,
      referenceId,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ syncQueue: [...state.syncQueue, item] }));
  },

  getTransactionById: (id) => get().transactions.find((t) => t.id === id),
}));
