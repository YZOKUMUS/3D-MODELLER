import { Image as ExpoImage } from 'expo-image';
import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
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
  contain?: boolean;
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

/** GitHub Pages / mobil: onbellek veya preload sonrasi `load` olayi gelmeyebilir; `complete` ile yakalariz. */
function WebCoverImg({
  uri,
  lazy,
  contain,
  accent,
  fallbackLetter,
  fallbackFontSize,
  style,
  placeholder,
}: {
  uri: string;
  lazy: boolean;
  contain: boolean;
  accent: string;
  fallbackLetter: string;
  fallbackFontSize: number;
  style: StyleProp<ViewStyle>;
  placeholder: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    setLoaded(false);
    const el = imgRef.current;
    if (!el) return;
    const markLoaded = () => setLoaded(true);
    if (el.complete && el.naturalWidth > 0) {
      markLoaded();
      return;
    }
    el.addEventListener('load', markLoaded, { once: true });
    return () => el.removeEventListener('load', markLoaded);
  }, [uri]);

  if (failed) {
    return (
      <View style={[styles.clip, style, styles.fallback, { backgroundColor: accent }]}>
        <Text style={[styles.fallbackLetter, { fontSize: fallbackFontSize }]}>{fallbackLetter}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.clip, style, { backgroundColor: accent }]}>
      {!loaded && placeholder}
      <img
        ref={imgRef}
        src={uri}
        alt=""
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onError={() => setFailed(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: contain ? 'contain' : 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      />
    </View>
  );
}

export function ModelCoverImage({
  source,
  accent,
  fallbackLetter,
  fallbackFontSize = 44,
  style,
  lazy = false,
  contain = false,
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
        <WebCoverImg
          uri={uri}
          lazy={lazy}
          contain={contain}
          accent={accent}
          fallbackLetter={fallbackLetter}
          fallbackFontSize={fallbackFontSize}
          style={style}
          placeholder={placeholder}
        />
      );
    }
  }

  // Metro `require()` ids: React Native's Image decodes bundled assets reliably on iOS/Android.
  // expo-image + numeric module id has been reported to miss onLoad / fail on cold start (Fabric).
  if (typeof source === 'number') {
    return (
      <View style={[styles.clip, style, { backgroundColor: accent }]}>
        {!loaded && placeholder}
        <RNImage
          source={source}
          style={styles.fillCover}
          resizeMode={contain ? 'contain' : 'cover'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.clip, style, { backgroundColor: accent }]}>
      {!loaded && placeholder}
      <ExpoImage
        source={source}
        style={styles.fillCover}
        contentFit={contain ? 'contain' : 'cover'}
        transition={300}
        cachePolicy="memory-disk"
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
