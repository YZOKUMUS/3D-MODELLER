import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1e' : '#f8fafc', borderColor: isDark ? '#2d2d35' : '#e2e8f0' }]}>
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <Icon name="user" size={32} color="#fff" />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>Sizin mağazanız</Text>
        <Text style={[styles.bio, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Bu demo uygulama, 3D modellerinizi listeleyip satış akışını göstermek için hazırlandı.
          Kendi ürünlerinizi data/catalog.ts dosyasından düzenleyebilirsiniz.
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.tint }]}>{CATALOG.length}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Örnek model</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.tint }]}>GLB</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Popüler format</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
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
    fontSize: 20,
    fontWeight: '800',
  },
  bio: {
    marginTop: 10,
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
