import { create } from 'zustand';
import { User, Shift } from '../types';
import { MOCK_USERS, MOCK_SHIFT } from '../data/mockData';

interface AuthState {
  user: User | null;
  shift: Shift | null;
  isOnline: boolean;
  isLoggedIn: boolean;

  login: (employeeId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openShift: (openingCash: number) => Promise<{ success: boolean; error?: string }>;
  closeShift: (actualCash: number) => Promise<{ success: boolean; variance: number }>;
  setOnline: (online: boolean) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  shift: null,
  isOnline: true,
  isLoggedIn: false,

  login: async (employeeId, pin) => {
    // Mock auth — in production, check against local SQLite / API
    const found = MOCK_USERS.find(
      (u) => u.employeeId === employeeId && u.isActive
    );
    if (!found) return { success: false, error: 'Employee ID tidak ditemukan.' };
    // Mock PIN check: pin === '1234' for kasir, '0000' for manager
    const validPin = found.role === 'cashier' ? '1234' : '0000';
    if (pin !== validPin) return { success: false, error: 'PIN tidak valid.' };

    set({ user: found, isLoggedIn: true });
    return { success: true };
  },

  logout: () => {
    set({ user: null, shift: null, isLoggedIn: false });
  },

  openShift: async (openingCash) => {
    const { user } = get();
    if (!user) return { success: false, error: 'User tidak ditemukan.' };
    const shift: Shift = {
      ...MOCK_SHIFT,
      id: `SHF-${Date.now()}`,
      employeeId: user.id,
      storeId: user.storeId,
      terminalId: user.terminalId,
      openingCash,
      openingTime: new Date().toISOString(),
      status: 'OPEN',
    };
    set({ shift });
    return { success: true };
  },

  closeShift: async (actualCash) => {
    const { shift } = get();
    // Mock calculation
    const expectedCash = (shift?.openingCash ?? 0) + 450000; // mock sales
    const variance = actualCash - expectedCash;
    set((state) => ({
      shift: state.shift
        ? { ...state.shift, status: 'CLOSED', actualCash, variance, closingTime: new Date().toISOString() }
        : null,
    }));
    return { success: true, variance };
  },

  setOnline: (online) => set({ isOnline: online }),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'manager') return true;
    return !!(user.permissions as Record<string, boolean>)[permission];
  },
}));
