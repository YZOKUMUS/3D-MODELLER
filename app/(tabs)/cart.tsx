import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { useColorScheme } from '@/components/useColorScheme';
import { useCart } from '@/context/CartContext';
import Colors from '@/constants/Colors';
import { formatTry } from '@/lib/format';
import { lightImpact, successNotification } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

export default function CartScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const { lines, ready, remove, setQuantity, clear, subtotal } = useCart();

  const checkout = () => {
    if (lines.length === 0) return;
    successNotification();
    Alert.alert(
      'Ödeme (demo)',
      `Toplam ${formatTry(subtotal)}. Gerçek uygulamada burada iyzico, Stripe veya mağaza linki bağlanır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sepeti temizle',
          style: 'destructive',
          onPress: () => {
            clear();
            lightImpact();
          },
        },
      ]
    );
  };

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Sepet yükleniyor…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120 + insets.bottom,
        }}>
        {lines.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="shopping-cart" size={48} color={isDark ? '#3f3f46' : '#cbd5e1'} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sepet boş</Text>
            <Text style={[styles.emptySub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Mağazadan modeller ekleyerek başlayın.
            </Text>
          </View>
        ) : (
          lines.map((line) => (
            <View
              key={line.model.id}
              style={[
                styles.line,
                {
                  backgroundColor: isDark ? '#1a1a1e' : '#f8fafc',
                  borderColor: isDark ? '#2d2d35' : '#e2e8f0',
                },
              ]}>
              <ModelCoverImage
                source={line.model.coverImage}
                accent={line.model.accent}
                fallbackLetter={line.model.title.slice(0, 1)}
                fallbackFontSize={22}
                style={styles.thumb}
              />
              <View style={styles.lineBody}>
                <Text style={[styles.lineTitle, { color: colors.text }]} numberOfLines={2}>
                  {line.model.title}
                </Text>
                <Text style={[styles.lineMeta, { color: isDark ? '#a1a1aa' : '#64748b' }]}>
                  {formatTry(line.model.price)} · birim
                </Text>
                <View style={styles.qtyRow}>
                  <Pressable
                    accessibilityLabel="Azalt"
                    onPress={() => {
                      lightImpact();
                      setQuantity(line.model.id, line.quantity - 1);
                    }}
                    style={[styles.qtyBtn, { borderColor: colors.tint }]}>
                    <Icon name="minus" size={14} color={colors.tint} />
                  </Pressable>
                  <Text style={[styles.qty, { color: colors.text }]}>{line.quantity}</Text>
                  <Pressable
                    accessibilityLabel="Artır"
                    onPress={() => {
                      lightImpact();
                      setQuantity(line.model.id, line.quantity + 1);
                    }}
                    style={[styles.qtyBtn, { borderColor: colors.tint }]}>
                    <Icon name="plus" size={14} color={colors.tint} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      lightImpact();
                      remove(line.model.id);
                    }}
                    style={styles.trash}>
                    <Icon name="trash" size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {lines.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: 16 + insets.bottom,
              backgroundColor: colors.background,
              borderTopColor: isDark ? '#27272a' : '#e2e8f0',
            },
          ]}>
          <View style={styles.footerRow}>
            <Text style={[styles.totalLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Ara toplam
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {formatTry(subtotal)}
            </Text>
          </View>
          <Pressable
            onPress={checkout}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: colors.tint, opacity: pressed ? 0.9 : 1 },
            ]}>
            <Text style={styles.ctaText}>Ödemeye geç</Text>
            <Icon name="arrow-right" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  line: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  lineBody: {
    flex: 1,
    marginLeft: 12,
  },
  lineTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  lineMeta: {
    marginTop: 4,
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  trash: {
    marginLeft: 'auto',
    padding: 8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
