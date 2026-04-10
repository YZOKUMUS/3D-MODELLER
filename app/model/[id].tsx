import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { useColorScheme } from '@/components/useColorScheme';
import { useCart } from '@/context/CartContext';
import Colors from '@/constants/Colors';
import { getModelById } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact, successNotification } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

export default function ModelDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const model = id ? getModelById(id) : undefined;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const { add } = useCart();

  if (!model) {
    return (
      <>
        <Stack.Screen options={{ title: 'Bulunamadı' }} />
        <View style={[styles.missing, { backgroundColor: colors.background }]}>
          <Text style={[styles.missingText, { color: colors.text }]}>Model bulunamadı.</Text>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.tint }]}>
            <Text style={styles.backBtnText}>Geri dön</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const addToCart = () => {
    lightImpact();
    add(model);
    successNotification();
  };

  return (
    <>
      <Stack.Screen options={{ title: model.title, headerBackTitle: 'Geri' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        <View style={styles.hero}>
          <ModelCoverImage
            source={model.coverImage}
            accent={model.accent}
            fallbackLetter={model.title.slice(0, 1)}
            fallbackFontSize={72}
            style={styles.heroImage}
          />
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{model.category}</Text>
          </View>
        </View>
        <View style={styles.pad}>
          <Text style={[styles.price, { color: colors.tint }]}>{formatTry(model.price)}</Text>
          <Text style={[styles.tagline, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {model.tagline}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}>
              <Icon name="cube" size={14} color={colors.tint} />
              <Text style={[styles.pillText, { color: colors.text }]}>{model.polyCount}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}>
              <Icon name="star" size={14} color="#fbbf24" />
              <Text style={[styles.pillText, { color: colors.text }]}>{model.rating}</Text>
            </View>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Açıklama</Text>
          <Text style={[styles.body, { color: isDark ? '#d4d4d8' : '#475569' }]}>
            {model.description}
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dosya formatları</Text>
          <View style={styles.formats}>
            {model.formats.map((f) => (
              <View
                key={f}
                style={[
                  styles.formatChip,
                  { borderColor: isDark ? '#3f3f46' : '#e2e8f0', backgroundColor: isDark ? '#18181b' : '#fff' },
                ]}>
                <Text style={[styles.formatText, { color: colors.text }]}>{f}</Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={addToCart}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: colors.tint, opacity: pressed ? 0.92 : 1 },
            ]}>
            <Icon name="shopping-cart" size={18} color="#fff" />
            <Text style={styles.ctaText}>Sepete ekle</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  pad: {
    padding: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 22,
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 24,
  },
  formats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  formatChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  formatText: {
    fontWeight: '700',
    fontSize: 14,
  },
  cta: {
    marginTop: 28,
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
    fontWeight: '800',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missingText: {
    fontSize: 17,
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
