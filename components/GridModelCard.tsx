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
import { BAMBU } from '@/constants/bambuTheme';
import { CATALOG, type CatalogModel } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact } from '@/lib/haptics';

type Props = {
  model: CatalogModel;
};

/** Bambu Handy beslemesi: Inter/Roboto benzeri sistem sans-serif. */
const FEED_SANS = Platform.select({
  web: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  default: {},
});

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
    <View style={styles.shadowHost}>
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
        <View style={styles.info}>
          <Pressable accessibilityRole="button" onPress={openDetail}>
            <Text
              style={styles.title}
              numberOfLines={2}
              {...Platform.select({
                android: { includeFontPadding: false },
              })}>
              {model.title}
            </Text>
          </Pressable>
          <View style={styles.priceRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Model detayı"
              onPress={openDetail}
              style={styles.priceHit}>
              <Text
                style={styles.price}
                numberOfLines={1}
                {...Platform.select({
                  android: { includeFontPadding: false },
                  default: {},
                })}>
                {formatTry(model.price)}
              </Text>
            </Pressable>
            <ModelLikeButton modelId={model.id} variant="iconOnly" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Dis kabuk: golge/elevation (overflow yok — golge kesilmesin) */
  shadowHost: {
    width: '100%',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.45,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
      default: {
        // web: RN genelde shadow* alanlarini map eder
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
    }),
  },
  /** Zeminden hafif daha acik + belirgin cerceve: kartlar ayri “kutu” gibi */
  root: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#1e1e24',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
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
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    color: BAMBU.handyFeedTitle,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'left',
    ...FEED_SANS,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 4,
    minWidth: 0,
  },
  priceHit: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
  },
  /** Sol: fiyat (beslemede ikincil satır gibi); sag: kalp */
  price: {
    color: BAMBU.handyFeedMeta,
    fontSize: 14,
    fontWeight: '500',
    ...FEED_SANS,
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
