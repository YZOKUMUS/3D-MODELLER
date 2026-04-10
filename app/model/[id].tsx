import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { useCart } from '@/context/CartContext';
import { getModelById } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact, successNotification } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

export default function ModelDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const model = id ? getModelById(id) : undefined;
  const insets = useSafeAreaInsets();
  const { add } = useCart();

  if (!model) {
    return (
      <>
        <Stack.Screen options={{ title: 'Bulunamadı', headerStyle: { backgroundColor: '#111' }, headerTintColor: '#fff' }} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>Model bulunamadı.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerBackTitle: 'Geri',
          headerTintColor: '#fff',
        }}
      />
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>

          <View style={styles.imageWrap}>
            <ModelCoverImage
              source={model.coverImage}
              accent={model.accent}
              fallbackLetter={model.title.slice(0, 1)}
              fallbackFontSize={72}
              style={styles.heroImage}
              contain
            />
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>1/1</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{model.title}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{model.category}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Icon name="star" size={14} color="#fbbf24" />
                <Text style={styles.statText}>{model.rating}</Text>
              </View>
              <View style={styles.stat}>
                <Icon name="cube" size={14} color="#71717a" />
                <Text style={styles.statText}>{model.polyCount}</Text>
              </View>
              <Text style={styles.priceTag}>{formatTry(model.price)}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Açıklama</Text>
            <Text style={styles.description}>{model.description}</Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={addToCart}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.9 : 1 }]}>
            <Icon name="shopping-cart" size={18} color="#fff" />
            <Text style={styles.ctaText}>Sepete Ekle</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
  scroll: {
    flex: 1,
  },
  imageWrap: {
    width: '100%',
    height: 380,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 380,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    color: '#fafafa',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    backgroundColor: '#1e1e24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a32',
  },
  badgeText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  priceTag: {
    color: '#00c853',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a32',
    marginTop: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1e1e24',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ctaBtn: {
    backgroundColor: '#00c853',
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
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missingText: {
    color: '#fafafa',
    fontSize: 17,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#00c853',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
