/**
 * AppNavigator — POS Kasir
 *
 * Uses a simple state-machine approach instead of React Navigation
 * to avoid native module dependencies during scaffold. All screens
 * are rendered in-process; navigation state is plain React state.
 *
 * Screen flow:
 *   LOGIN → OPEN_SHIFT → SALES ↔ PAYMENT → RECEIPT → SALES
 *                                  ↕
 *              HISTORY / HOLD / VOID / RETURN / CASH / CLOSING / MEMBER
 */

import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

import { LoginScreen }              from '../screens/LoginScreen';
import { OpenShiftScreen }          from '../screens/OpenShiftScreen';
import { SalesScreen }              from '../screens/SalesScreen';
import { PaymentScreen }            from '../screens/PaymentScreen';
import { ReceiptScreen }            from '../screens/ReceiptScreen';
import { TransactionHistoryScreen } from '../screens/TransactionHistoryScreen';
import { HoldRecallScreen }         from '../screens/HoldRecallScreen';
import { VoidScreen }               from '../screens/VoidScreen';
import { ReturnScreen }             from '../screens/ReturnScreen';
import { CashManagementScreen }     from '../screens/CashManagementScreen';
import { ClosingShiftScreen }       from '../screens/ClosingShiftScreen';
import { MemberSearchScreen }       from '../screens/MemberSearchScreen';

type Screen =
  | 'LOGIN'
  | 'OPEN_SHIFT'
  | 'SALES'
  | 'PAYMENT'
  | 'RECEIPT'
  | 'HISTORY'
  | 'HOLD'
  | 'VOID'
  | 'RETURN'
  | 'CASH'
  | 'CLOSING'
  | 'MEMBER';

interface NavState {
  screen: Screen;
  params?: Record<string, unknown>;
}

export const AppNavigator: React.FC = () => {
  const { isLoggedIn, shift, logout } = useAuthStore();

  // Derive initial screen from auth state
  const initialScreen = (): Screen => {
    if (!isLoggedIn) return 'LOGIN';
    if (!shift || shift.status !== 'OPEN') return 'OPEN_SHIFT';
    return 'SALES';
  };

  const [nav, setNav] = useState<NavState>({ screen: initialScreen() });

  const go = (screen: Screen, params?: Record<string, unknown>) =>
    setNav({ screen, params });

  const goBack = () => go('SALES');

  // ── Render current screen ─────────────────────────────────
  switch (nav.screen) {

    case 'LOGIN':
      return (
        <LoginScreen
          onLoginSuccess={() => {
            // Read latest state after login completes
            const s = useAuthStore.getState().shift;
            go((s && s.status === 'OPEN') ? 'SALES' : 'OPEN_SHIFT');
          }}
        />
      );

    case 'OPEN_SHIFT':
      return (
        <OpenShiftScreen
          onShiftOpened={() => go('SALES')}
        />
      );

    case 'SALES':
      return (
        <SalesScreen
          onPayPress={() => go('PAYMENT')}
          onHoldPress={() => go('HOLD')}
          onMenuPress={(screen) => {
            const map: Record<string, Screen> = {
              member: 'MEMBER',
              recall: 'HOLD',
              void:   'VOID',
              return: 'RETURN',
              history:'HISTORY',
              shift:  'CLOSING',
              cash:   'CASH',
            };
            const target = map[screen];
            if (target) go(target);
          }}
        />
      );

    case 'PAYMENT':
      return (
        <PaymentScreen
          onSuccess={(txId) => go('RECEIPT', { transactionId: txId })}
          onBack={() => go('SALES')}
        />
      );

    case 'RECEIPT':
      return (
        <ReceiptScreen
          transactionId={(nav.params?.transactionId as string) ?? ''}
          onNewTransaction={() => go('SALES')}
          onClose={() => go('SALES')}
        />
      );

    case 'HISTORY':
      return (
        <TransactionHistoryScreen
          onBack={goBack}
          onReprintPress={(txId) => go('RECEIPT', { transactionId: txId })}
          onReturnPress={(txId) => go('RETURN', { transactionId: txId })}
        />
      );

    case 'HOLD':
      return (
        <HoldRecallScreen
          onBack={goBack}
          onRecall={() => go('SALES')}
        />
      );

    case 'VOID':
      return (
        <VoidScreen
          onBack={goBack}
          initialTransactionId={(nav.params?.transactionId as string) ?? ''}
        />
      );

    case 'RETURN':
      return (
        <ReturnScreen
          onBack={goBack}
          initialTransactionId={(nav.params?.transactionId as string) ?? ''}
        />
      );

    case 'CASH':
      return (
        <CashManagementScreen
          onBack={goBack}
        />
      );

    case 'CLOSING':
      return (
        <ClosingShiftScreen
          onShiftClosed={() => {
            logout();
            go('LOGIN');
          }}
          onBack={goBack}
        />
      );

    case 'MEMBER':
      return (
        <MemberSearchScreen
          onBack={goBack}
          onMemberSelected={() => go('SALES')}
        />
      );

    default:
      return (
        <LoginScreen
          onLoginSuccess={() => go('OPEN_SHIFT')}
        />
      );
  }
};
