import { Platform } from 'react-native';

/** Dokunma hedefi — erişilebilirlik önerisi ~44pt */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export function tabBarBottomPadding(bottomInset: number): number {
  if (Platform.OS === 'ios') {
    return Math.max(bottomInset, 8);
  }
  return Math.max(bottomInset, 10);
}
