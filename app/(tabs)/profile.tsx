import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATALOG } from '@/data/catalog';
import { lightImpact } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1e' : '#f8fafc', borderColor: isDark ? '#2d2d35' : '#e2e8f0' }]}>
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <Icon name="user" size={32} color="#fff" />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>YZOKUMUS</Text>
        <Text style={[styles.tagline, { color: colors.tint }]}>Hobi ile üretiyorum</Text>
        <Text style={[styles.bio, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Bu işi bir dükkân sahibi gibi değil, tamamen hobi olarak yapıyorum. Boş zamanlarımda 3D modele
          merak sardım; bazen kendi fikirlerimi çiziyorum, bazen de beğendiğim açık kaynak tasarımları
          deniyorum. Baskılarımı Bambu Lab P1S ile alıyorum — sessiz, hızlı ve günlük denemeler için
          bana çok iyi gelen bir makine. Buradaki liste, bastığım ve paylaşmak istediğim parçaların
          vitrini; fiyatlar ve sepet daha çok uygulamanın nasıl görüneceğini göstermek için örnek.
          Asıl amacım ürettiklerimi derli toplu göstermek ve 3D baskı merakını birlikte büyütmek.
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.tint }]}>{CATALOG.length}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Vitrindeki parça</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.tint }]}>P1S</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Bambu Lab</Text>
          </View>
        </View>
      </View>

      <Link href="/modal" asChild>
        <Pressable
          onPress={() => lightImpact()}
          style={({ pressed }) => [
            styles.linkRow,
            {
              backgroundColor: isDark ? '#1a1a1e' : '#fff',
              borderColor: isDark ? '#2d2d35' : '#e2e8f0',
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Icon name="question-circle" size={20} color={colors.tint} />
          <Text style={[styles.linkText, { color: colors.text }]}>Satış ve uygulama hakkında</Text>
          <Icon name="chevron-right" size={14} color={isDark ? '#52525b' : '#94a3b8'} />
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  bio: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.85,
  },
  linkRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
