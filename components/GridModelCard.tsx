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

/** Kart köşesi: GLB veya GLB·OBJ veya GLB +2 */
function formatChipLabel(formats: string[]): string {
  const f = formats.filter(Boolean);
  if (f.length === 0) return '';
  if (f.length === 1) return f[0];
  if (f.length === 2) return `${f[0]}·${f[1]}`;
  return `${f[0]} +${f.length - 1}`;
}

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
  const formatLabel = formatChipLabel(model.formats);

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
            {formatLabel.length > 0 && (
              <View style={styles.formatBadge}>
                <Text style={styles.formatBadgeText} numberOfLines={1}>
                  {formatLabel}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
        <View style={styles.info}>
          <Pressable accessibilityRole="button" onPress={openDetail}>
            <Text style={styles.title} numberOfLines={2}>
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 4,
    minWidth: 0,
  },
  priceHit: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
  },
  /** Sol: fiyat; sag: kalp */
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
  formatBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    maxWidth: '72%',
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  formatBadgeText: {
    color: '#e4e4e7',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
