import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GridModelCard } from '@/components/GridModelCard';
import { ModelCoverImage } from '@/components/ModelCoverImage';
import { useColorScheme } from '@/components/useColorScheme';
import { BAMBU } from '@/constants/bambuTheme';
import { CATALOG, CATEGORIES, type ModelCategory } from '@/data/catalog';
import { lightImpact } from '@/lib/haptics';
import { HIT_SLOP } from '@/lib/layout';

type FeedTab = 'foryou' | 'featured' | 'trending' | 'print';

const FEED_TABS: { id: FeedTab; label: string }[] = [
  { id: 'foryou', label: 'Senin için' },
  { id: 'featured', label: 'Öne çıkan' },
  { id: 'trending', label: 'Trend' },
  { id: 'print', label: '3D Baskı' },
];

const QUICK_NAV: {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  category: ModelCategory | 'Tümü';
  color: string;
  bg: string;
}[] = [
  { label: 'Tüm modeller', icon: 'th', category: 'Tümü', color: BAMBU.iconColor[0], bg: BAMBU.iconBg[0] },
  { label: 'Karakter', icon: 'user', category: 'Karakter', color: BAMBU.iconColor[1], bg: BAMBU.iconBg[1] },
  { label: 'Araç', icon: 'car', category: 'Araç', color: BAMBU.iconColor[2], bg: BAMBU.iconBg[2] },
  { label: 'Mimari', icon: 'building', category: 'Mimari', color: BAMBU.iconColor[3], bg: BAMBU.iconBg[3] },
];

export default function StoreScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width: windowWidth } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ModelCategory | 'Tümü'>('Tümü');
  const [feedTab, setFeedTab] = useState<FeedTab>('foryou');

  const scrollRef = useRef<ScrollView>(null);
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const showFab = useRef(false);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const shouldShow = y > 600;
      if (shouldShow !== showFab.current) {
        showFab.current = shouldShow;
        Animated.timing(fabOpacity, {
          toValue: shouldShow ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
    [fabOpacity],
  );

  const scrollToTop = useCallback(() => {
    lightImpact();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const filtered = useMemo(() => {
    let list = [...CATALOG];
    if (category !== 'Tümü') {
      list = list.filter((m) => m.category === category);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q) ||
          m.formats.some((f) => f.toLowerCase().includes(q))
      );
    }
    switch (feedTab) {
      case 'featured':
        return [...list].sort((a, b) => b.rating - a.rating);
      case 'trending':
        return [...list].sort((a, b) => Number(b.id) - Number(a.id));
      case 'print':
        return list.filter((m) => m.formats.some((f) => f.toUpperCase().includes('GLB')));
      default:
        return list;
    }
  }, [query, category, feedTab]);

  const featuredCarousel = useMemo(() => CATALOG.slice(0, 3), []);
  const collectionsCarousel = useMemo(() => CATALOG.slice(3, 6), []);

  const sheetHMargin = 12 * 2;
  const sheetPadding = 16 * 2;
  const innerWidth = Math.max(0, windowWidth - sheetHMargin - sheetPadding);
  const gap = 10;
  const useTwoCols = innerWidth >= 304;
  const colWidth = useTwoCols ? Math.floor((innerWidth - gap) / 2) : Math.floor(innerWidth);

  const carouselCardWidth = Math.min(160, Math.max(124, Math.round(windowWidth * 0.42)));
  const carouselImgHeight = Math.round(carouselCardWidth * 0.66);

  const scrollBottomPad = 20 + tabBarHeight;

  const cardSurface = isDark ? BAMBU.cardBgDark : BAMBU.cardBg;
  const searchBg = isDark ? BAMBU.searchBgDark : BAMBU.searchBg;
  const textPrimary = isDark ? '#fafafa' : '#18181b';
  const textMuted = isDark ? '#a1a1aa' : '#71717a';

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0a0a0c' : BAMBU.gradient[0] }]}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={Platform.OS === 'android'}
        contentContainerStyle={{ paddingBottom: scrollBottomPad + insets.bottom }}>
        <LinearGradient
          colors={[BAMBU.gradient[0], BAMBU.gradient[1], BAMBU.gradient[2]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroGrad, { paddingTop: insets.top + 20, paddingBottom: 72 }]}>
          <Text style={styles.heroTitle} maxFontSizeMultiplier={1.35}>
            Zengin 3D model koleksiyonu
          </Text>
          <Text style={styles.heroSub} maxFontSizeMultiplier={1.3}>
            Çok formatlı dijital üretim — çeşitli kategorilerde modeller
          </Text>
        </LinearGradient>

        <View style={[styles.sheet, { backgroundColor: cardSurface, marginTop: -52 }]}>
          <View style={[styles.searchRow, { backgroundColor: searchBg }]}>
            <FontAwesome name="search" size={16} color={textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ara: model, format…"
              placeholderTextColor={textMuted}
              style={[styles.input, { color: textPrimary }]}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              textAlignVertical="center"
              underlineColorAndroid="transparent"
            />
          </View>

          <View style={styles.quickRow}>
            {QUICK_NAV.map((item) => {
              const active = category === item.category;
              return (
                <Pressable
                  key={item.label}
                  hitSlop={HIT_SLOP}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}
                  onPress={() => {
                    lightImpact();
                    setCategory(item.category);
                  }}
                  style={styles.quickItem}>
                  <View
                    style={[
                      styles.quickIcon,
                      { backgroundColor: active ? item.bg : isDark ? '#27272a' : '#f4f4f5' },
                    ]}>
                    <FontAwesome name={item.icon} size={22} color={active ? item.color : textMuted} />
                  </View>
                  <Text style={[styles.quickLabel, { color: textMuted }]} numberOfLines={2}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.carouselBlock}>
            <View style={styles.carouselHead}>
              <Text style={[styles.carouselTitle, { color: textPrimary }]}>Öne çıkanlar</Text>
              <Text style={[styles.carouselHint, { color: textMuted }]}>Editör seçimi</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={Platform.OS === 'android'}
              contentContainerStyle={styles.carouselScroll}>
              {featuredCarousel.map((m) => (
                <Pressable
                  key={m.id}
                  hitSlop={HIT_SLOP}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  onPress={() => {
                    lightImpact();
                    router.push(`/model/${m.id}`);
                  }}
                  style={[
                    styles.carouselCard,
                    {
                      width: carouselCardWidth,
                      backgroundColor: isDark ? '#252530' : '#f4f4f5',
                    },
                  ]}>
                  <ModelCoverImage
                    source={m.coverImage}
                    accent={m.accent}
                    fallbackLetter={m.title.slice(0, 1)}
                    style={{
                      width: carouselCardWidth,
                      height: carouselImgHeight,
                      borderTopLeftRadius: 14,
                      borderTopRightRadius: 14,
                    }}
                  />
                  <Text style={[styles.carouselCardTitle, { color: textPrimary }]} numberOfLines={1}>
                    {m.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.carouselBlock}>
            <View style={styles.carouselHead}>
              <Text style={[styles.carouselTitle, { color: textPrimary }]}>Koleksiyonlar</Text>
              <Text style={[styles.carouselHint, { color: textMuted }]}>Yeni eklenenler</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={Platform.OS === 'android'}
              contentContainerStyle={styles.carouselScroll}>
              {collectionsCarousel.map((m) => (
                <Pressable
                  key={m.id}
                  hitSlop={HIT_SLOP}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  onPress={() => {
                    lightImpact();
                    router.push(`/model/${m.id}`);
                  }}
                  style={[
                    styles.carouselCard,
                    {
                      width: carouselCardWidth,
                      backgroundColor: isDark ? '#252530' : '#f4f4f5',
                    },
                  ]}>
                  <ModelCoverImage
                    source={m.coverImage}
                    accent={m.accent}
                    fallbackLetter={m.title.slice(0, 1)}
                    style={{
                      width: carouselCardWidth,
                      height: carouselImgHeight,
                      borderTopLeftRadius: 14,
                      borderTopRightRadius: 14,
                    }}
                  />
                  <Text style={[styles.carouselCardTitle, { color: textPrimary }]} numberOfLines={1}>
                    {m.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.feedTabs}>
            {FEED_TABS.map((t) => {
              const active = feedTab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    lightImpact();
                    setFeedTab(t.id);
                  }}
                  style={[styles.feedTabBtn, active && styles.feedTabBtnActive]}>
                  <Text
                    style={[
                      styles.feedTabText,
                      { color: active ? BAMBU.tabActive : textMuted },
                      active && styles.feedTabTextActive,
                    ]}>
                    {t.label}
                  </Text>
                  {active ? <View style={styles.feedUnderline} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.grid}>
            {filtered.length === 0 ? (
              <Text style={[styles.empty, { color: textMuted }]}>
                Sonuç yok. Aramayı veya sekmeyi değiştirin.
              </Text>
            ) : (
              filtered.map((model) => (
                <GridModelCard key={model.id} model={model} width={colWidth} isDark={isDark} />
              ))
            )}
          </View>

          <View style={styles.moreCats}>
            <Text style={[styles.moreCatsTitle, { color: textPrimary }]}>Tüm kategoriler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['Tümü', ...CATEGORIES] as const).map((cat) => {
                const active = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      lightImpact();
                      setCategory(cat);
                    }}
                    style={[
                      styles.chip,
                      active
                        ? { backgroundColor: BAMBU.tabActive }
                        : { backgroundColor: isDark ? '#27272a' : '#f4f4f5' },
                    ]}>
                    <Text style={[styles.chipText, { color: active ? '#fff' : textMuted }]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.fabWrap,
          { bottom: tabBarHeight + 16, opacity: fabOpacity },
        ]}>
        <Pressable
          onPress={scrollToTop}
          style={styles.fab}
          accessibilityLabel="Başa dön"
          accessibilityRole="button">
          <FontAwesome name="chevron-up" size={20} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  heroGrad: {
    paddingHorizontal: 22,
  },
  heroTitle: {
    color: BAMBU.heroText,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 320,
  },
  sheet: {
    marginHorizontal: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 2,
  },
  quickItem: {
    width: '23%',
    alignItems: 'center',
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 13,
    fontWeight: '600',
  },
  carouselBlock: {
    marginTop: 20,
  },
  carouselHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  carouselTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  carouselHint: {
    fontSize: 12,
  },
  carouselScroll: {
    gap: 12,
    paddingRight: 8,
  },
  carouselCard: {
    width: 148,
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  carouselImg: {
    width: 148,
    height: 100,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  carouselCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    marginTop: 6,
  },
  feedTabs: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 22,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.25)',
  },
  feedTabBtn: {
    paddingVertical: 6,
    minWidth: 72,
  },
  feedTabBtnActive: {},
  feedTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedTabTextActive: {
    fontWeight: '800',
  },
  feedUnderline: {
    marginTop: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: BAMBU.tabActive,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  empty: {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 28,
    fontSize: 15,
  },
  moreCats: {
    marginTop: 8,
  },
  moreCatsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fabWrap: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BAMBU.tabActive,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
