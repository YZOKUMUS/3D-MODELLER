import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { useCart } from '@/context/CartContext';
import { CATALOG, getModelById } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact, successNotification } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

const WHATSAPP_NUMBER = '905357685477';

export default function ModelDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const model = id ? getModelById(id) : undefined;
  const insets = useSafeAreaInsets();
  const { add } = useCart();

  const goBackOne = () => {
    lightImpact();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as const);
    }
  };

  /** Benzer modellerde push ile yığılmış ekranları atlayıp doğrudan ana listeye döner. */
  const goToMainFeed = () => {
    lightImpact();
    router.replace('/(tabs)' as const);
  };

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

  const openWhatsApp = () => {
    const msg = encodeURIComponent(`Merhaba, "${model.title}" modeli hakkında bilgi almak istiyorum. (${formatTry(model.price)})`);
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
  };

  const shareModel = async () => {
    lightImpact();
    try {
      await Share.share({ message: `${model.title} - ${formatTry(model.price)} | YZOKUMUS 3D Modelleri` });
    } catch (_) {}
  };

  const similarModels = CATALOG.filter((m) => m.category === model.category && m.id !== model.id).slice(0, 6);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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

            <View style={styles.actionRow}>
              <Pressable onPress={shareModel} style={styles.actionBtn}>
                <Icon name="arrow-right" size={16} color="#a1a1aa" />
                <Text style={styles.actionText}>Paylaş</Text>
              </Pressable>
              <Pressable onPress={openWhatsApp} style={styles.whatsappBtn}>
                <Text style={styles.whatsappText}>WhatsApp ile Sor</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Açıklama</Text>
            <Text style={styles.description}>{model.description}</Text>

            {similarModels.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Benzer Modeller</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
                  {similarModels.map((sm) => (
                    <Pressable
                      key={sm.id}
                      onPress={() => { lightImpact(); router.push(`/model/${sm.id}`); }}
                      style={styles.similarCard}>
                      <ModelCoverImage
                        source={sm.coverImage}
                        accent={sm.accent}
                        fallbackLetter={sm.title.slice(0, 1)}
                        fallbackFontSize={20}
                        style={styles.similarImg}
                      />
                      <Text style={styles.similarTitle} numberOfLines={1}>{sm.title}</Text>
                      <Text style={styles.similarPrice}>{formatTry(sm.price)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </ScrollView>

        <View style={[styles.floatingBackWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
          <Pressable
            onPress={goBackOne}
            hitSlop={12}
            accessibilityLabel="Bir önceki ekrana dön"
            style={({ pressed }) => [styles.floatingBackBtn, { opacity: pressed ? 0.85 : 1 }]}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={goToMainFeed}
            hitSlop={12}
            accessibilityLabel="Ana sayfa, model listesi"
            style={({ pressed }) => [styles.floatingBackBtn, { opacity: pressed ? 0.85 : 1 }]}>
            <Icon name="home" size={20} color="#fff" />
          </Pressable>
        </View>

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
  floatingBackWrap: {
    position: 'absolute',
    left: 12,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e1e24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  whatsappText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  similarScroll: {
    gap: 10,
    paddingBottom: 8,
  },
  similarCard: {
    width: 130,
    backgroundColor: '#1a1a1e',
    borderRadius: 10,
    overflow: 'hidden',
  },
  similarImg: {
    width: 130,
    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  similarTitle: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    marginTop: 6,
  },
  similarPrice: {
    color: '#00c853',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingBottom: 8,
    marginTop: 3,
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
