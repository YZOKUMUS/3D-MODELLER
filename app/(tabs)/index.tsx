import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GridModelCard } from '@/components/GridModelCard';
import { BAMBU } from '@/constants/bambuTheme';
import { CATALOG, CATALOG_TAB_CATEGORIES, type ModelCategory } from '@/data/catalog';
import { lightImpact } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

const TAB_FONT = Platform.select({
  web: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  default: {},
});

const ALL_TABS: { id: string; label: string; category: ModelCategory | 'Tümü' }[] = [
  { id: 'all', label: 'Senin İçin', category: 'Tümü' },
  { id: 'trending', label: 'Trend', category: 'Tümü' },
  ...CATALOG_TAB_CATEGORIES.map((c) => ({ id: c, label: c, category: c })),
];

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(20);

  const validTabIds = useMemo(() => new Set(ALL_TABS.map((t) => t.id)), []);

  useEffect(() => {
    if (!validTabIds.has(activeTab)) {
      setActiveTab('all');
    }
  }, [activeTab, validTabIds]);

  const scrollRef = useRef<ScrollView>(null);
  const tabsScrollRef = useRef<ScrollView>(null);
  const fabUpOpacity = useRef(new Animated.Value(0)).current;
  const fabDownOpacity = useRef(new Animated.Value(0)).current;
  const showFabUp = useRef(false);
  const showFabDown = useRef(false);
  const contentHeight = useRef(0);
  const layoutHeight = useRef(0);
  const scrollY = useRef(0);
  const [fabUpHit, setFabUpHit] = useState(false);
  const [fabDownHit, setFabDownHit] = useState(false);

  const updateFabVisibility = useCallback(
    (y: number) => {
      const maxY = Math.max(0, contentHeight.current - layoutHeight.current);
      const canScroll = maxY > 80;
      const shouldShowUp = y > 280;
      const shouldShowDown = canScroll && y < maxY - 72;

      if (shouldShowUp !== showFabUp.current) {
        showFabUp.current = shouldShowUp;
        setFabUpHit(shouldShowUp);
        Animated.timing(fabUpOpacity, {
          toValue: shouldShowUp ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
      if (shouldShowDown !== showFabDown.current) {
        showFabDown.current = shouldShowDown;
        setFabDownHit(shouldShowDown);
        Animated.timing(fabDownOpacity, {
          toValue: shouldShowDown ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
    [fabUpOpacity, fabDownOpacity],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      scrollY.current = y;
      updateFabVisibility(y);
    },
    [updateFabVisibility],
  );

  const scrollToTop = useCallback(() => {
    lightImpact();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const scrollToBottom = useCallback(() => {
    lightImpact();
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const currentTab = ALL_TABS.find((t) => t.id === activeTab) ?? ALL_TABS[0];

  const filtered = useMemo(() => {
    let list = [...CATALOG].reverse();
    if (currentTab.category !== 'Tümü') {
      list = list.filter((m) => m.category === currentTab.category);
    }
    if (activeTab === 'trending') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, activeTab, currentTab.category]);

  const visibleModels = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = filtered.length > visibleCount;

  const gap = 10;
  /** Dar mobilde sag sutun kenara yapisip fiyat kesilmesin diye biraz ic boşluk */
  const sidePad = 10;
  const leftCol: typeof visibleModels = [];
  const rightCol: typeof visibleModels = [];
  visibleModels.forEach((m, i) => (i % 2 === 0 ? leftCol : rightCol).push(m));

  const scrollBottomPad = 20 + tabBarHeight;

  return (
    <View style={[styles.root, { backgroundColor: BAMBU.handyScreenBg }]}>
      <StatusBar style="light" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: BAMBU.handyNavBg }]}>
        <View style={styles.searchRow}>
          <Icon name="search" size={16} color="#71717a" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ara..."
            placeholderTextColor="#71717a"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        ref={tabsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={styles.tabsScrollContent}
        style={[styles.tabsContainer, { backgroundColor: BAMBU.handyNavBg }]}>
        <View collapsable={false} style={styles.tabsRow}>
          {ALL_TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <Pressable
                key={t.id}
                collapsable={false}
                onPress={() => {
                  lightImpact();
                  setActiveTab(t.id);
                  setVisibleCount(20);
                }}
                style={styles.tab}>
                <Text
                  style={[
                    styles.tabText,
                    TAB_FONT,
                    { color: active ? BAMBU.handyTabActive : BAMBU.handyTabInactive },
                    active && styles.tabTextActive,
                  ]}
                  {...Platform.select({
                    android: { includeFontPadding: false },
                  })}>
                  {t.label}
                </Text>
                <View style={styles.tabIndicatorSlot}>
                  <View
                    style={[
                      styles.tabIndicator,
                      active && { backgroundColor: BAMBU.handyIndicator },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityLabel="Daha fazla kategori"
            hitSlop={12}
            onPress={() => {
              lightImpact();
              tabsScrollRef.current?.scrollToEnd({ animated: true });
            }}
            style={styles.tabChevron}>
            <Icon name="chevron-down" size={18} color={BAMBU.handyTabInactive} />
          </Pressable>
        </View>
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        style={styles.mainScroll}
        onScroll={onScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={Platform.OS === 'android'}
        onContentSizeChange={(_w, h) => {
          contentHeight.current = h;
          const run =
            typeof requestAnimationFrame !== 'undefined'
              ? requestAnimationFrame
              : (cb: () => void) => setTimeout(cb, 0);
          run(() => updateFabVisibility(scrollY.current));
        }}
        onLayout={(e) => {
          layoutHeight.current = e.nativeEvent.layout.height;
          const run =
            typeof requestAnimationFrame !== 'undefined'
              ? requestAnimationFrame
              : (cb: () => void) => setTimeout(cb, 0);
          run(() => updateFabVisibility(scrollY.current));
        }}
        contentContainerStyle={{ paddingBottom: scrollBottomPad + insets.bottom, paddingHorizontal: sidePad }}>

        {filtered.length === 0 ? (
          <Text style={styles.empty}>Sonuç bulunamadı.</Text>
        ) : (
          <View style={[styles.masonry, { gap }]}>
            <View style={[styles.masonryCol, { gap }]}>
              {leftCol.map((model) => (
                <GridModelCard key={model.id} model={model} />
              ))}
            </View>
            <View style={[styles.masonryCol, { gap }]}>
              {rightCol.map((model) => (
                <GridModelCard key={model.id} model={model} />
              ))}
            </View>
          </View>
        )}

        {hasMore && (
          <Pressable
            onPress={() => { lightImpact(); setVisibleCount((c) => c + 20); }}
            style={styles.loadMore}>
            <Text style={styles.loadMoreText}>
              Daha fazla göster ({filtered.length - visibleCount} kaldı)
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.fabColumn, { bottom: tabBarHeight + 10 }]} pointerEvents="box-none">
        <Animated.View
          style={[styles.fabSlot, { bottom: 44, opacity: fabUpOpacity }]}
          pointerEvents={fabUpHit ? 'box-none' : 'none'}>
          <Pressable
            onPress={scrollToTop}
            style={styles.fab}
            accessibilityLabel="En üste git">
            <Icon name="chevron-up" size={18} color="#d4d4d8" />
          </Pressable>
        </Animated.View>
        <Animated.View
          style={[styles.fabSlot, { bottom: 0, opacity: fabDownOpacity }]}
          pointerEvents={fabDownHit ? 'box-none' : 'none'}>
          <Pressable
            onPress={scrollToBottom}
            style={styles.fab}
            accessibilityLabel="En alta git">
            <Icon name="chevron-down" size={18} color="#d4d4d8" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BAMBU.handySearchBg,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fafafa',
    paddingVertical: 2,
  },
  tabsContainer: {
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      web: { minHeight: 52 },
      default: { minHeight: 48 },
    }),
  },
  tabsScrollContent: {
    flexGrow: 0,
    alignItems: 'flex-end',
    paddingBottom: 0,
    paddingRight: 8,
    paddingLeft: 6,
    ...Platform.select({
      web: { paddingTop: 4 },
      default: { paddingTop: 2 },
    }),
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 4,
  },
  mainScroll: {
    flex: 1,
  },
  tab: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { overflow: 'visible' },
      default: {},
    }),
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabIndicatorSlot: {
    marginTop: 8,
    height: 3,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabChevron: {
    paddingLeft: 6,
    paddingRight: 4,
    paddingBottom: 10,
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  masonry: {
    flexDirection: 'row',
    marginTop: 4,
  },
  masonryCol: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    color: '#71717a',
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 15,
  },
  loadMore: {
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1e1e24',
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#00c853',
    fontSize: 15,
    fontWeight: '700',
  },
  fabColumn: {
    position: 'absolute',
    right: 10,
    width: 36,
    height: 80,
    alignItems: 'center',
  },
  fabSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 30, 36, 0.88)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
