import { Image as ExpoImage } from 'expo-image';
import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
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

function nativeUriKey(source: ImageSourcePropType): string {
  if (typeof source === 'number') return `n:${source}`;
  if (source && typeof source === 'object' && 'uri' in source && typeof (source as { uri: string }).uri === 'string') {
    return `u:${(source as { uri: string }).uri}`;
  }
  return 'x';
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
  const fade = useRef(new Animated.Value(0)).current;

  const sourceKey = nativeUriKey(source);
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    fade.setValue(0);
  }, [sourceKey]);

  const markLoaded = () => {
    setLoaded(true);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

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
        <Animated.View style={[styles.fillCover, { opacity: fade }]}>
          <RNImage
            source={source}
            style={styles.fillCover}
            resizeMode={contain ? 'contain' : 'cover'}
            onLoad={markLoaded}
            onError={() => setFailed(true)}
          />
        </Animated.View>
      </View>
    );
  }

  // Yerel dosya (file://) ve galeri URI: ExpoImage bazen onLoad geciktirir veya hic bildirmez; kapak
  // dokununca yeniden cizilince gorunuyormus gibi olur. RN Image bu URI'lerde kararli.
  if (
    Platform.OS !== 'web' &&
    source &&
    typeof source === 'object' &&
    'uri' in source &&
    typeof (source as { uri: string }).uri === 'string'
  ) {
    const uri = (source as { uri: string }).uri;
    return (
      <View style={[styles.clip, style, { backgroundColor: accent }]}>
        {!loaded && placeholder}
        <Animated.View style={[styles.fillCover, { opacity: fade }]}>
          <RNImage
            source={{ uri }}
            style={styles.fillCover}
            resizeMode={contain ? 'contain' : 'cover'}
            onLoad={markLoaded}
            onLoadEnd={markLoaded}
            onError={() => setFailed(true)}
          />
        </Animated.View>
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
        onLoad={markLoaded}
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
