import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { ModelLikeButton } from '@/components/ModelLikeButton';
import { CATALOG, type CatalogModel } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact } from '@/lib/haptics';

type Props = {
  model: CatalogModel;
  width: number;
};

export function GridModelCard({ model, width }: Props) {
  const router = useRouter();
  const imgHeight = Math.round(width * (0.85 + (parseInt(model.id, 10) % 4) * 0.12));
  const isNew = parseInt(model.id, 10) > CATALOG.length - 10;

  const openDetail = () => {
    lightImpact();
    router.push(`/model/${model.id}`);
  };

  return (
    <View style={[styles.root, { width }]}>
      <Pressable
        accessibilityRole="button"
        onPress={openDetail}
        style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        <View>
          <ModelCoverImage
            source={model.coverImage}
            accent={model.accent}
            fallbackLetter={model.title.slice(0, 1)}
            fallbackFontSize={28}
            style={{ width, height: imgHeight, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
          />
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>YENİ</Text>
            </View>
          )}
        </View>
      </Pressable>
      <ModelLikeButton modelId={model.id} variant="compact" />
      <Pressable accessibilityRole="button" onPress={openDetail} style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{model.title}</Text>
        <View style={styles.row}>
          <Text style={styles.category}>{model.category}</Text>
          <Text style={styles.price}>{formatTry(model.price)}</Text>
        </View>
      </Pressable>
    </View>
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
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#00c853',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});
