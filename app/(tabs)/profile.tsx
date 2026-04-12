import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATALOG } from '@/data/catalog';
import { Icon } from '@/lib/web-icon';

function ProfileFact({
  icon,
  title,
  body,
  colors,
  isDark,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  title: string;
  body: string;
  colors: (typeof Colors)['light'];
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.factRow,
        { backgroundColor: isDark ? '#141418' : '#f1f5f9', borderColor: isDark ? '#27272f' : '#e2e8f0' },
      ]}>
      <View style={[styles.factIcon, { backgroundColor: isDark ? '#26262c' : '#fff' }]}>
        <Icon name={icon} size={18} color={colors.tint} />
      </View>
      <View style={styles.factTextWrap}>
        <Text style={[styles.factTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.factBody, { color: isDark ? '#94a3b8' : '#64748b' }]}>{body}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const categoryCount = useMemo(() => new Set(CATALOG.map((m) => m.category)).size, []);

  const minScrollInner = useMemo(() => {
    const usable = windowHeight - tabBarHeight - Math.max(insets.top, 8) - 24;
    return Math.max(usable, 640);
  }, [windowHeight, tabBarHeight, insets.top]);

  const cardBg = isDark ? '#1a1a1e' : '#f8fafc';
  const cardBorder = isDark ? '#2d2d35' : '#e2e8f0';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.screenContent,
        {
          flexGrow: 1,
          minHeight: minScrollInner,
          paddingBottom: 28 + tabBarHeight + insets.bottom,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={[styles.heroAccent, { backgroundColor: colors.tint }]} />
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <Icon name="user" size={40} color="#fff" />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>YZOKUMUS</Text>
        <Text style={[styles.tagline, { color: colors.tint }]}>Hobi ile üretiyorum</Text>
        <Text style={[styles.lead, { color: isDark ? '#cbd5e1' : '#475569' }]}>
          3B baskıyı seri üretim stresi olmadan, merak ve deneme odağında sürdürüyorum. Bu vitrin; el emeği
          parçaları toplu görmek, tarafıma not düşmek ve arada “şunu da denesem” demek için.
        </Text>
      </View>

      <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.blockTitle, { color: colors.text }]}>Kısaca hikâye</Text>
        <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Bu işi bir dükkân sahibi gibi değil, tamamen hobi olarak yapıyorum. Boş zamanlarımda 3D model
          merakına sardım; bazen kendi fikirlerimi çiziyorum, bazen de beğendiğim açık kaynak tasarımları
          aynı parça üzerinde defalarca revize ederek deniyorum.
        </Text>
        <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Baskılarımı Bambu Lab P1S ile alıyorum — ev içinde sessiz çalışması, hızı ve “bugün şu malzemeyi
          dene” dediğim anlarda hazır olması benim için çok değerli. Makine değil, birlikte oynadığım
          bir araç gibi düşünüyorum onu.
        </Text>
        <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Buradaki liste; bastığım, beğendiğim ve paylaşmak istediğim modellerin vitrini. Fiyat ve sepet
          alanları uygulamanın nasıl göründüğünü göstermek için örnek; asıl mesele ürettiklerimi derli
          toplu sunmak ve 3B baskı merakını paylaşmak.
        </Text>
      </View>

      <View style={[styles.statsGrid, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={[styles.statCell, { borderColor: cardBorder }]}>
          <Text style={[styles.statNum, { color: colors.tint }]}>{CATALOG.length}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Vitrinde model</Text>
          <Text style={[styles.statHint, { color: isDark ? '#64748b' : '#94a3b8' }]}>Katalog güncellenerek büyür</Text>
        </View>
        <View style={[styles.statCell, { borderColor: cardBorder }]}>
          <Text style={[styles.statNum, { color: colors.tint }]}>{categoryCount}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Kategori çeşidi</Text>
          <Text style={[styles.statHint, { color: isDark ? '#64748b' : '#94a3b8' }]}>Üst sekmelerden süzersin</Text>
        </View>
        <View style={[styles.statCell, styles.statCellLast, { borderColor: cardBorder }]}>
          <Text style={[styles.statNum, { color: colors.tint }]}>P1S</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Bambu Lab</Text>
          <Text style={[styles.statHint, { color: isDark ? '#64748b' : '#94a3b8' }]}>Günlük deneme makinem</Text>
        </View>
      </View>

      <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.blockTitle, { color: colors.text }]}>Bu uygulamada neler var?</Text>
        <View style={styles.factList}>
          <ProfileFact
            icon="cube"
            title="Model vitrini"
            body="Liste, arama, kategori sekmeleri ve detayda çoklu fotoğraf kaydırması — her kayıt katalogdan gelir."
            colors={colors}
            isDark={isDark}
          />
          <ProfileFact
            icon="heart"
            title="Beğeniler cihazında"
            body="Kalpli kayıtlar telefonunda kalır; hesap veya sunucu gerekmez."
            colors={colors}
            isDark={isDark}
          />
          <ProfileFact
            icon="shopping-cart"
            title="Örnek sepet"
            body="Sepet de cihazda saklanır; ödeme akışı vitrin amaçlıdır — gerçek satışta ödeme ve teslim entegrasyonu eklenebilir."
            colors={colors}
            isDark={isDark}
          />
          <ProfileFact
            icon="star"
            title="Trend ve görünürlük"
            body="Trend sekmesi puana göre sıralanır; ‘Yeni’ rozeti son eklenen kayıtlara işaret eder."
            colors={colors}
            isDark={isDark}
          />
        </View>
      </View>

      <View style={[styles.noteCard, { borderColor: isDark ? '#3f3f46' : '#cbd5e1', backgroundColor: isDark ? '#16161a' : '#f1f5f9' }]}>
        <Icon name="info-circle" size={20} color={colors.tint} style={styles.noteIcon} />
        <Text style={[styles.noteText, { color: isDark ? '#a1a1aa' : '#475569' }]}>
          İçerik ve kapak görselleri bilgisayarındaki admin paneli ile güncellenir; uygulama kabaca “canlı
          katalog + vitrin” gibi düşünülebilir. Görüş veya önerin varsa aynı şekilde not düşebilirsin —
          burası hem vitrin hem de kendi üretim günlüğüm için bir pencere.
        </Text>
      </View>

      <Text style={[styles.footerLine, { color: isDark ? '#52525b' : '#94a3b8' }]}>YZOKUMUS · 3B vitrin</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingBottom: 26,
    paddingTop: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  name: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '800',
  },
  lead: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 400,
  },
  block: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  blockTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  para: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 0,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  statCellLast: {
    borderRightWidth: 0,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  statHint: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 2,
  },
  factList: {
    gap: 10,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  factIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  factTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  factTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  factBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  noteIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  footerLine: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 1.2,
  },
});
