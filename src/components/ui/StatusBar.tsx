import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';

export const POSStatusBar: React.FC = () => {
  const { user, shift, isOnline } = useAuthStore();

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.storeName}>{user?.storeName ?? 'POS Kasir'}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.info}>{user?.terminalId}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.info}>Kasir: {user?.name}</Text>
        {shift && (
          <>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.info}>Shift #{shift.id.slice(-3)}</Text>
          </>
        )}
      </View>
      <View style={styles.right}>
        <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? Colors.success : Colors.danger }]} />
        <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
        <Text style={styles.info}>{timeStr}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.info}>{dateStr}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 40,
    backgroundColor: Colors.sky900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  info: {
    fontSize: FontSize.caption,
    color: Colors.sky200,
  },
  dot: {
    fontSize: FontSize.caption,
    color: Colors.sky300,
    opacity: 0.5,
  },
  onlineIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: FontSize.caption,
    color: Colors.sky200,
  },
});
