import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Icon } from '@/lib/web-icon';

const BULLETS = [
  'Ürünleri `data/catalog.ts` içinden düzenleyin; fiyat, format ve açıklamalar buradan gelir.',
  'Sepet cihazda saklanır (AsyncStorage). Uygulamayı silince sıfırlanır.',
  'Gerçek satış için ödeme (iyzico, Stripe) ve dosya teslimi (S3, e-posta linki) ekleyin.',
  'Expo ile derlemek: npx expo prebuild ve EAS Build kullanın.',
];

export default function ModalScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.tint }]}>
        <Icon name="info-circle" size={28} color="#fff" />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>YZOKUMUS</Text>
      <Text style={[styles.lead, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        Bu sürüm, 3D model mağazanızın mobil deneyimini hızlıca denemeniz içindir. Tüm akışlar çevrimdışı
        demo verisiyle çalışır.
      </Text>
      {BULLETS.map((line) => (
        <View key={line} style={styles.row}>
          <Icon name="check-circle" size={18} color={colors.tint} style={styles.rowIcon} />
          <Text style={[styles.bullet, { color: isDark ? '#e4e4e7' : '#334155' }]}>{line}</Text>
        </View>
      ))}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  lead: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  rowIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  bullet: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
