import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { BAMBU } from '@/constants/bambuTheme';
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
  const imgSize = width - 2;

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
          backgroundColor: isDark ? '#1c1c22' : '#fafafa',
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={[styles.imageWrap, { width: imgSize, height: imgSize }]}>
        <ModelCoverImage
          source={model.coverImage}
          accent={model.accent}
          fallbackLetter={model.title.slice(0, 1)}
          fallbackFontSize={32}
          style={[styles.cover, { width: imgSize, height: imgSize }]}
        />
      </View>
      <Text style={[styles.title, { color: isDark ? '#f4f4f5' : '#18181b' }]} numberOfLines={2}>
        {model.title}
      </Text>
      <View style={styles.meta}>
        <Text style={[styles.price, { color: BAMBU.tabActive }]}>{formatTry(model.price)}</Text>
        <View style={styles.rating}>
          <FontAwesome name="star" size={10} color="#fbbf24" />
          <Text style={[styles.ratingText, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
            {model.rating}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 14,
    padding: 6,
    marginBottom: 12,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  cover: {
    borderRadius: 12,
  },
  title: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    minHeight: 34,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
