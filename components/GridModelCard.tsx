import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { ModelLikeButton } from '@/components/ModelLikeButton';
import { CATALOG, type CatalogModel } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact } from '@/lib/haptics';

type Props = {
  model: CatalogModel;
};

export function GridModelCard({ model }: Props) {
  const router = useRouter();
  const [imgSlotW, setImgSlotW] = useState(0);
  const aspect = 0.85 + (parseInt(model.id, 10) % 4) * 0.12;
  const imgHeight =
    imgSlotW > 0 ? Math.round(imgSlotW * aspect) : Math.round(168 * aspect);

  const onImageSlotLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setImgSlotW((prev) => (prev !== w ? w : prev));
  }, []);

  const isNew = parseInt(model.id, 10) > CATALOG.length - 10;

  const openDetail = () => {
    lightImpact();
    router.push(`/model/${model.id}`);
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        onPress={openDetail}
        style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        <View style={styles.imageClip} onLayout={onImageSlotLayout}>
          <ModelCoverImage
            source={model.coverImage}
            accent={model.accent}
            fallbackLetter={model.title.slice(0, 1)}
            fallbackFontSize={28}
            style={[styles.coverImg, { height: imgHeight }]}
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
        <Text style={styles.title} numberOfLines={2}>
          {model.title}
        </Text>
        <Text style={styles.category} numberOfLines={1} ellipsizeMode="tail">
          {model.category}
        </Text>
        <Text
          style={styles.price}
          {...Platform.select({
            android: { includeFontPadding: false },
          })}>
          {formatTry(model.price)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Genislik %100 = flex sutunla ayni; tasip yok. overflow ile alt koseler duzgun. */
  root: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#1a1a1e',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageClip: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  coverImg: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignSelf: 'stretch',
  },
  info: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  category: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 5,
  },
  /** Sola yasali, dogal genislik: sagda kesilme / overflow hatasi olmaz */
  price: {
    marginTop: 4,
    color: '#00c853',
    fontSize: 13,
    fontWeight: '800',
    alignSelf: 'flex-start',
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
