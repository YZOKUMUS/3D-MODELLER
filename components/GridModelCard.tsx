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
  const imgWidth = width;
  const imgHeight = Math.round(imgWidth * (0.8 + (parseInt(model.id, 10) % 5) * 0.15));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        lightImpact();
        router.push(`/model/${model.id}`);
      }}
      style={({ pressed }) => [
        styles.root,
        {
          width,
          backgroundColor: '#1a1a1e',
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <ModelCoverImage
        source={model.coverImage}
        accent={model.accent}
        fallbackLetter={model.title.slice(0, 1)}
        fallbackFontSize={28}
        style={{ width: imgWidth, height: imgHeight, borderRadius: 12 }}
      />
      <Text style={styles.title} numberOfLines={2}>
        {model.title}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.price}>{formatTry(model.price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  title: {
    color: '#e4e4e7',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    paddingHorizontal: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 10,
    marginTop: 4,
  },
  price: {
    color: '#00c853',
    fontSize: 14,
    fontWeight: '800',
  },
});
