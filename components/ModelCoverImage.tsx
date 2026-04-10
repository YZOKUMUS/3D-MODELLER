import { Image } from 'expo-image';
import { useState } from 'react';
import {
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
  /** Kart / detay için ~44–72, sepet küçük önizleme için ~22 */
  fallbackFontSize?: number;
  style?: StyleProp<ViewStyle>;
};

export function ModelCoverImage({
  source,
  accent,
  fallbackLetter,
  fallbackFontSize = 44,
  style,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[styles.clip, style, styles.fallback, { backgroundColor: accent }]}>
        <Text style={[styles.fallbackLetter, { fontSize: fallbackFontSize }]}>{fallbackLetter}</Text>
      </View>
    );
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
  /** Web’de absoluteFill + % yükseklik kartları taşır; kapak her zaman kutu içinde kalır */
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
