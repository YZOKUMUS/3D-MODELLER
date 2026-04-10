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
  const [loaded, setLoaded] = useState(false);

  const placeholder = (
    <View style={[StyleSheet.absoluteFill, styles.fallback, { backgroundColor: accent }]}>
      <Text style={[styles.fallbackLetter, { fontSize: fallbackFontSize }]}>{fallbackLetter}</Text>
    </View>
  );

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
        <View style={[styles.clip, style, { backgroundColor: accent }]}>
          {!loaded && placeholder}
          <img
            src={uri}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          />
        </View>
      );
    }
  }

  return (
    <View style={[styles.clip, style, { backgroundColor: accent }]}>
      {!loaded && placeholder}
      <Image
        source={source}
        style={styles.fillCover}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
        recyclingKey={typeof source === 'number' ? String(source) : undefined}
        onLoad={() => setLoaded(true)}
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
