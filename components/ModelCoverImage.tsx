import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Image as RNImage,
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  source: ImageSourcePropType;
  accent: string;
  fallbackLetter: string;
  fallbackFontSize?: number;
  style?: StyleProp<ViewStyle>;
  lazy?: boolean;
};

function resolveWebUri(source: ImageSourcePropType): string | null {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') {
    try {
      const resolved = RNImage.resolveAssetSource(source);
      return resolved?.uri ?? null;
    } catch {
      return null;
    }
  }
  if (source && typeof source === 'object' && 'uri' in source) {
    return (source as { uri: string }).uri;
  }
  return null;
}

export function ModelCoverImage({
  source,
  accent,
  fallbackLetter,
  fallbackFontSize = 44,
  style,
  lazy = false,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[styles.clip, style, styles.fallback, { backgroundColor: accent }]}>
        <Text style={[styles.fallbackLetter, { fontSize: fallbackFontSize }]}>{fallbackLetter}</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    const uri = resolveWebUri(source);
    if (uri) {
      return (
        <View style={[styles.clip, style]}>
          <img
            src={uri}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
            onError={() => setFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </View>
      );
    }
  }

  return (
    <View style={[styles.clip, style]}>
      <Image
        source={source}
        style={styles.fillCover}
        contentFit="cover"
        transition={200}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: '#1a1a1e',
  },
  fillCover: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLetter: {
    fontWeight: '800',
    color: 'rgba(255,255,255,0.95)',
  },
});
