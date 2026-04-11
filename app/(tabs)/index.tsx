import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
import { CATALOG, CATEGORIES, type ModelCategory } from '@/data/catalog';
import { lightImpact } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

const ALL_TABS: { id: string; label: string; category: ModelCategory | 'Tümü' }[] = [
  { id: 'all', label: 'Senin İçin', category: 'Tümü' },
  { id: 'trending', label: 'Trend', category: 'Tümü' },
  ...CATEGORIES.map((c) => ({ id: c, label: c, category: c as ModelCategory })),
];

export default function StoreScreen() {
  const router = useRouter();
  const isDark = true;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width: windowWidth } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(20);

  const scrollRef = useRef<ScrollView>(null);
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const showFab = useRef(false);
  const contentHeight = useRef(0);
  const layoutHeight = useRef(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const shouldShow = y > 300;
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

  const scrollToBottom = useCallback(() => {
    lightImpact();
    const maxY = contentHeight.current - layoutHeight.current;
    if (maxY > 0) scrollRef.current?.scrollTo({ y: maxY, animated: true });
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

  const gap = 6;
  const sidePad = 6;
  const colWidth = Math.floor((windowWidth - sidePad * 2 - gap) / 2);

  const leftCol: typeof visibleModels = [];
  const rightCol: typeof visibleModels = [];
  visibleModels.forEach((m, i) => (i % 2 === 0 ? leftCol : rightCol).push(m));

  const scrollBottomPad = 20 + tabBarHeight;

  return (
    <View style={[styles.root, { backgroundColor: '#111' }]}>
      <StatusBar style="light" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
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
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={styles.tabsScrollContent}
        style={styles.tabsContainer}>
        {/* Samsung / One UI: inner row must not be collapsed off native hierarchy */}
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
                style={[styles.tab, active && styles.tabActive]}>
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                  {...Platform.select({
                    android: { includeFontPadding: false },
                  })}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
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
        onContentSizeChange={(_w, h) => { contentHeight.current = h; }}
        onLayout={(e) => { layoutHeight.current = e.nativeEvent.layout.height; }}
        contentContainerStyle={{ paddingBottom: scrollBottomPad + insets.bottom, paddingHorizontal: sidePad }}>

        {filtered.length === 0 ? (
          <Text style={styles.empty}>Sonuç bulunamadı.</Text>
        ) : (
          <View style={[styles.masonry, { gap }]}>
            <View style={[styles.masonryCol, { gap }]}>
              {leftCol.map((model) => (
                <GridModelCard key={model.id} model={model} width={colWidth} isDark={isDark} />
              ))}
            </View>
            <View style={[styles.masonryCol, { gap }]}>
              {rightCol.map((model) => (
                <GridModelCard key={model.id} model={model} width={colWidth} isDark={isDark} />
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

      <Animated.View style={[styles.fabWrap, { bottom: tabBarHeight + 16, opacity: fabOpacity }]}>
        <Pressable onPress={scrollToTop} style={styles.fab}>
          <Icon name="chevron-up" size={20} color="#fff" />
        </Pressable>
      </Animated.View>
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
    backgroundColor: '#111',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e24',
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
    backgroundColor: '#111',
    flexGrow: 0,
    flexShrink: 0,
    ...Platform.select({
      // rn-web: horizontal ScrollView height can collapse; minHeight avoids clipping tab row
      web: { minHeight: 48 },
      default: {},
    }),
  },
  tabsScrollContent: {
    flexGrow: 0,
    // 'center' on cross-axis + wrong viewport height clips tab tops on web
    alignItems: 'flex-start',
    paddingBottom: 10,
    ...Platform.select({
      web: { paddingTop: 6 },
      default: {},
    }),
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  mainScroll: {
    flex: 1,
  },
  tab: {
    flexShrink: 0,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e1e24',
    ...Platform.select({
      web: { overflow: 'visible' },
      default: {},
    }),
  },
  tabActive: {
    backgroundColor: '#00c853',
  },
  tabText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  masonry: {
    flexDirection: 'row',
    marginTop: 4,
  },
  masonryCol: {
    flex: 1,
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
  fabWrap: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00c853',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
