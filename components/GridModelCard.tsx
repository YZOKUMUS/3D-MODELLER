import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import type { CatalogModel } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact } from '@/lib/haptics';

type Props = {
  model: CatalogModel;
  width: number;
  isDark: boolean;
};

export function GridModelCard({ model, width, isDark }: Props) {
  const router = useRouter();
  const imgHeight = Math.round(width * (0.85 + (parseInt(model.id, 10) % 4) * 0.12));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        lightImpact();
        router.push(`/model/${model.id}`);
      }}
      style={({ pressed }) => [
        styles.root,
        { width, opacity: pressed ? 0.85 : 1 },
      ]}>
      <ModelCoverImage
        source={model.coverImage}
        accent={model.accent}
        fallbackLetter={model.title.slice(0, 1)}
        fallbackFontSize={28}
        style={{ width, height: imgHeight, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{model.title}</Text>
        <View style={styles.row}>
          <Text style={styles.category}>{model.category}</Text>
          <Text style={styles.price}>{formatTry(model.price)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 12,
    backgroundColor: '#1a1a1e',
    overflow: 'hidden',
  },
  info: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  category: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '500',
  },
  price: {
    color: '#00c853',
    fontSize: 13,
    fontWeight: '800',
  },
});
