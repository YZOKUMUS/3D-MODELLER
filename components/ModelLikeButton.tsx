import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLikes } from '@/context/LikesContext';
import { lightImpact } from '@/lib/haptics';
import { Icon } from '@/lib/web-icon';

type Props = {
  modelId: string;
  /** compact: foto alti satir | detail: urun detay | iconOnly: sadece kucuk kalp (kartta fiyat karsisi) */
  variant?: 'compact' | 'detail' | 'iconOnly';
};

const ICON_ONLY_SIZE = 15;

export function ModelLikeButton({ modelId, variant = 'compact' }: Props) {
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(modelId);
  const isDetail = variant === 'detail';
  const isIconOnly = variant === 'iconOnly';

  if (isIconOnly) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={liked ? 'Beğeniyi kaldır' : 'Beğen'}
        hitSlop={12}
        onPress={() => {
          lightImpact();
          toggleLike(modelId);
        }}
        style={({ pressed }) => [styles.iconOnlyPress, { opacity: pressed ? 0.75 : 1 }]}>
        <Icon
          name={liked ? 'heart' : 'heart-o'}
          size={ICON_ONLY_SIZE}
          color={liked ? '#ff4d6d' : '#a1a1aa'}
        />
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrap, isDetail && styles.wrapDetail]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={liked ? 'Beğeniyi kaldır' : 'Beğen'}
        onPress={() => {
          lightImpact();
          toggleLike(modelId);
        }}
        hitSlop={isDetail ? 10 : 14}
        style={({ pressed }) => [
          styles.press,
          isDetail && styles.pressDetail,
          { opacity: pressed ? 0.75 : 1 },
        ]}>
        <Icon name={liked ? 'heart' : 'heart-o'} size={isDetail ? 22 : 18} color={liked ? '#ff4d6d' : '#a1a1aa'} />
        {isDetail && (
          <Text style={[styles.label, liked && styles.labelLiked]}>{liked ? 'Beğendin' : 'Beğen'}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  iconOnlyPress: {
    flexShrink: 0,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrap: {
    backgroundColor: '#151518',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a32',
  },
  wrapDetail: {
    backgroundColor: '#111',
    borderBottomWidth: 0,
  },
  press: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  pressDetail: {
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  label: {
    color: '#a1a1aa',
    fontSize: 15,
    fontWeight: '700',
  },
  labelLiked: {
    color: '#fda4af',
  },
});
