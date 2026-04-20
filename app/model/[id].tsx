import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { ModelLikeButton } from '@/components/ModelLikeButton';
import { usePersonalModels } from '@/context/PersonalModelsContext';
import { getDetailSlides } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

export default function ModelDetailScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const { getModelById, mergedCatalog } = usePersonalModels();
  const model = id ? getModelById(id) : undefined;
  const insets = useSafeAreaInsets();

  const slides = useMemo(() => (model ? getDetailSlides(model) : []), [model]);
  const slideWidth = windowWidth;
  const [slideIndex, setSlideIndex] = useState(0);
  const galleryRef = useRef<FlatList | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setSlideIndex(first.index);
    },
    [],
  );

  useEffect(() => {
    setSlideIndex(0);
  }, [model?.id]);

  const goGalleryPrev = useCallback(() => {
    if (slides.length < 2) return;
    const next = Math.max(0, slideIndex - 1);
    lightImpact();
    galleryRef.current?.scrollToIndex({ index: next, animated: true });
  }, [slideIndex, slides.length]);

  const goGalleryNext = useCallback(() => {
    if (slides.length < 2) return;
    const next = Math.min(slides.length - 1, slideIndex + 1);
    lightImpact();
    galleryRef.current?.scrollToIndex({ index: next, animated: true });
  }, [slideIndex, slides.length]);

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

  const goToResimEkle = () => {
    lightImpact();
    router.push('/(tabs)/resim-ekle' as Parameters<typeof router.push>[0]);
  };

  const similarModels = useMemo(() => {
    if (!model) return [];
    return mergedCatalog
      .filter((m) => m.category === model.category && m.id !== model.id)
      .slice(0, 6);
  }, [mergedCatalog, model?.category, model?.id]);

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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        {/* Horizontal gallery must sit outside vertical ScrollView so Android swipes work. */}
        <View style={styles.imageWrap}>
          <FlatList
            ref={galleryRef}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `${model.id}-slide-${i}`}
            renderItem={({ item }) => (
              <View style={{ width: slideWidth, height: 380 }}>
                <ModelCoverImage
                  source={item}
                  accent={model.accent}
                  fallbackLetter={model.title.slice(0, 1)}
                  fallbackFontSize={72}
                  style={[styles.heroImage, { width: slideWidth }]}
                  contain
                />
              </View>
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
            onScrollToIndexFailed={({ index }) => {
              galleryRef.current?.scrollToOffset({
                offset: index * slideWidth,
                animated: true,
              });
            }}
          />
          {slides.length > 1 && (
            <>
              <Pressable
                accessibilityLabel="Önceki fotoğraf"
                onPress={goGalleryPrev}
                disabled={slideIndex === 0}
                hitSlop={8}
                style={[styles.galleryArrow, styles.galleryArrowLeft, slideIndex === 0 && styles.galleryArrowDisabled]}>
                <View style={styles.galleryArrowInner}>
                  <Icon name="chevron-left" size={17} color="rgba(255,255,255,0.82)" />
                </View>
              </Pressable>
              <Pressable
                accessibilityLabel="Sonraki fotoğraf"
                onPress={goGalleryNext}
                disabled={slideIndex >= slides.length - 1}
                hitSlop={8}
                style={[
                  styles.galleryArrow,
                  styles.galleryArrowRight,
                  slideIndex >= slides.length - 1 && styles.galleryArrowDisabled,
                ]}>
                <View style={styles.galleryArrowInner}>
                  <Icon name="chevron-right" size={17} color="rgba(255,255,255,0.82)" />
                </View>
              </Pressable>
              <View style={styles.galleryDots} pointerEvents="none">
                {slides.map((_, i) => (
                  <View
                    key={`dot-${model.id}-${i}`}
                    style={[styles.galleryDot, i === slideIndex && styles.galleryDotActive]}
                  />
                ))}
              </View>
              <View style={styles.galleryFooter} pointerEvents="box-none">
                <Text style={styles.galleryHint} numberOfLines={2}>
                  Sağa/sola kaydırın veya yan oklara dokunun.
                </Text>
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {slideIndex + 1}/{slides.length}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <ScrollView
          style={styles.bodyScroll}
          nestedScrollEnabled={Platform.OS === 'android'}
          contentContainerStyle={{ paddingBottom: 28 + insets.bottom }}>
          <ModelLikeButton modelId={model.id} variant="detail" />

          <View style={styles.content}>
            <Text style={styles.title}>{model.title}</Text>

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
            onPress={goToResimEkle}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.9 : 1 }]}>
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.ctaText}>Vitrine model / foto ekle</Text>
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
  bodyScroll: {
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
  galleryArrow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: 'center',
    zIndex: 9,
  },
  galleryArrowLeft: {
    left: 4,
  },
  galleryArrowRight: {
    right: 4,
  },
  galleryArrowInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryArrowDisabled: {
    opacity: 0.22,
  },
  galleryDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    zIndex: 7,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  galleryDotActive: {
    backgroundColor: '#00c853',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  galleryFooter: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 8,
  },
  galleryHint: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  imageCounter: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
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
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  goCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#00c853',
    backgroundColor: '#151518',
  },
  goCartText: {
    color: '#00c853',
    fontSize: 15,
    fontWeight: '800',
  },
  ctaBtn: {
    flex: 1,
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
