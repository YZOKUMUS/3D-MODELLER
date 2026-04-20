import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModelCoverImage } from '@/components/ModelCoverImage';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePersonalModels } from '@/context/PersonalModelsContext';
import { CATEGORIES, type ModelCategory } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact } from '@/lib/haptics';

const FORMAT_OPTIONS = ['GLB', 'OBJ', 'FBX', 'STL', 'STEP'] as const;

export default function PersonalStudioScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    supportsPersonal,
    personalOnlyAsModels,
    addFromPicker,
    deletePersonal,
  } = usePersonalModels();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ModelCategory>(CATEGORIES[0]);
  const [formats, setFormats] = useState<string[]>(['GLB']);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [galleryUris, setGalleryUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const cardBg = isDark ? '#1a1a1e' : '#f8fafc';
  const cardBorder = isDark ? '#2d2d35' : '#e2e8f0';

  const toggleFormat = (f: string) => {
    lightImpact();
    setFormats((prev) => {
      const has = prev.includes(f);
      if (has && prev.length === 1) return prev;
      if (has) return prev.filter((x) => x !== f);
      return [...prev, f];
    });
  };

  const pickCoverCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin', 'Kamera izni verilmedi.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) setCoverUri(res.assets[0].uri);
  }, []);

  const pickCoverLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin', 'Galeri izni verilmedi.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) setCoverUri(res.assets[0].uri);
  }, []);

  const pickGalleryExtras = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin', 'Galeri izni verilmedi.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 12,
    });
    if (!res.canceled) {
      const picked = res.assets.map((a) => a.uri).filter(Boolean);
      setGalleryUris((prev) => {
        const seen = new Set(prev);
        const merged = [...prev];
        for (const u of picked) {
          if (!seen.has(u)) {
            seen.add(u);
            merged.push(u);
          }
        }
        return merged.slice(0, 12);
      });
    }
  }, []);

  /** Tek kayıt: seçilen sırayla ilk = kapak, kalanlar = detayda sağa/sola kaydırmalı galeri. */
  const pickAllPhotosForOneModel = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin', 'Galeri izni verilmedi.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 15,
    });
    if (res.canceled) return;
    const uris = res.assets.map((a) => a.uri).filter(Boolean);
    if (uris.length === 0) return;
    setCoverUri(uris[0]);
    setGalleryUris(uris.length > 1 ? uris.slice(1) : []);
  }, []);

  const onSave = useCallback(async () => {
    if (!supportsPersonal) return;
    const t = title.trim();
    if (!t) {
      Alert.alert('Eksik', 'Model adı girin.');
      return;
    }
    const p = parseInt(price.replace(/\s/g, ''), 10);
    if (!Number.isFinite(p) || p < 0) {
      Alert.alert('Eksik', 'Geçerli bir fiyat (tam sayı) girin.');
      return;
    }
    if (!coverUri) {
      Alert.alert('Eksik', 'Kapak için kamera veya galeriden foto seçin.');
      return;
    }
    if (formats.length === 0) {
      Alert.alert('Eksik', 'En az bir dosya formatı seçin.');
      return;
    }
    setSaving(true);
    try {
      const result = await addFromPicker({
        title: t,
        price: p,
        category,
        description: description.trim(),
        formats,
        coverUri,
        galleryUris,
      });
      if (result.ok) {
        lightImpact();
        setTitle('');
        setPrice('');
        setDescription('');
        setCategory(CATEGORIES[0]);
        setFormats(['GLB']);
        setCoverUri(null);
        setGalleryUris([]);
        Alert.alert('Tamam', 'Model vitrine eklendi (bu telefonda saklanır).');
      } else {
        Alert.alert('Hata', result.message);
      }
    } finally {
      setSaving(false);
    }
  }, [
    supportsPersonal,
    title,
    price,
    coverUri,
    formats,
    category,
    description,
    galleryUris,
    addFromPicker,
  ]);

  const onDelete = (id: string, name: string) => {
    Alert.alert('Silinsin mi?', name, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          lightImpact();
          void deletePersonal(id);
        },
      },
    ]);
  };

  const webBlock = useMemo(
    () => (
      <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.blockTitle, { color: colors.text }]}>Yalnızca telefon</Text>
        <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Bu ekran Android veya iOS uygulamasında çalışır. Web önizlemesinde katalog düzenlenemez; model
          eklemek için Expo Go veya derlenmiş APK ile açın.
        </Text>
      </View>
    ),
    [cardBg, cardBorder, colors.text, isDark],
  );

  if (Platform.OS === 'web') {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Telefondan vitrin',
            headerStyle: { backgroundColor: '#111' },
            headerTintColor: '#fff',
          }}
        />
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom }}>
          {webBlock}
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Telefondan vitrin',
          headerStyle: { backgroundColor: '#111' },
          headerTintColor: '#fff',
        }}
      />
      <FlatList
        data={personalOnlyAsModels}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ gap: 14, paddingBottom: 8 }}>
            <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.blockTitle, { color: colors.text }]}>Yeni model</Text>
              <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Birden fazla fotoğrafı tek vitrin kaydında tutmak için aşağıdan galeride hepsini seç: ilki kapak,
                diğerleri model detayında sağa/sola kaydırarak görünür. Ayrı ayrı model oluşturmaz.
              </Text>

              <Pressable
                onPress={() => void pickAllPhotosForOneModel()}
                style={[styles.saveBtn, { backgroundColor: colors.tint, marginBottom: 4 }]}>
                <Text style={styles.saveBtnText}>Tek model — galeriden tüm fotoğrafları seç</Text>
              </Pressable>
              <Text style={[styles.hint, { color: isDark ? '#94a3b8' : '#64748b', marginBottom: 12 }]}>
                Seçim sırası önemli: ilk foto liste kapaklarında, sonrakiler detay galerisinde 2., 3., … sırayla
                çıkar. Tek foto seçersen sadece kapak olur.
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>Kapak fotoğrafı (ayrı ayrı)</Text>
              <View style={styles.row}>
                <Pressable
                  onPress={pickCoverCamera}
                  style={[styles.btn, { borderColor: colors.tint, backgroundColor: isDark ? '#26262c' : '#fff' }]}>
                  <Text style={[styles.btnText, { color: colors.tint }]}>Kamera</Text>
                </Pressable>
                <Pressable
                  onPress={pickCoverLibrary}
                  style={[styles.btn, { borderColor: cardBorder, backgroundColor: isDark ? '#26262c' : '#fff' }]}>
                  <Text style={[styles.btnText, { color: colors.text }]}>Galeri</Text>
                </Pressable>
              </View>
              {coverUri ? (
                <ModelCoverImage
                  source={{ uri: coverUri }}
                  accent={colors.tint}
                  fallbackLetter="?"
                  style={styles.preview}
                />
              ) : null}

              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Ek fotoğraflar (isteğe bağlı)</Text>
              <Text style={[styles.hint, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Galeride birden fazla foto seç: genelde birine dokunup sonra diğerlerine işaret koyarak çoklu seçim
                yapılır (Samsung Galeri’de üstte “Seç” veya benzeri). İstersen aynı düğmeye tekrar basıp yeni seçimler
                ekle (öncekilerle birleşir, en fazla 12).
              </Text>
              <Pressable
                onPress={pickGalleryExtras}
                style={[styles.btnWide, { borderColor: cardBorder, backgroundColor: isDark ? '#26262c' : '#fff' }]}>
                <Text style={[styles.btnText, { color: colors.text }]}>
                  Galeriden seç ({galleryUris.length} dosya)
                </Text>
              </Pressable>
              {galleryUris.length > 0 ? (
                <Pressable
                  onPress={() => {
                    lightImpact();
                    setGalleryUris([]);
                  }}
                  style={[styles.btnWide, { borderColor: '#b91c1c', marginTop: 8 }]}>
                  <Text style={[styles.btnText, { color: '#f87171', fontSize: 13 }]}>Ek fotoğrafları temizle</Text>
                </Pressable>
              ) : null}

              <Text style={[styles.label, { color: colors.text }]}>Model adı</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Örn. Kalem tutacağı"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: cardBorder, backgroundColor: isDark ? '#111' : '#fff' },
                ]}
              />

              <Text style={[styles.label, { color: colors.text }]}>Fiyat (TL)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="199"
                keyboardType="number-pad"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: cardBorder, backgroundColor: isDark ? '#111' : '#fff' },
                ]}
              />

              <Text style={[styles.label, { color: colors.text }]}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {CATEGORIES.map((c) => {
                  const on = c === category;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => {
                        lightImpact();
                        setCategory(c);
                      }}
                      style={[
                        styles.chip,
                        {
                          borderColor: on ? colors.tint : cardBorder,
                          backgroundColor: on ? (isDark ? '#1e3a2f' : '#ecfdf5') : isDark ? '#26262c' : '#fff',
                        },
                      ]}>
                      <Text style={{ color: on ? colors.tint : colors.text, fontWeight: '700', fontSize: 13 }}>{c}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={[styles.label, { color: colors.text }]}>Formatlar</Text>
              <View style={styles.wrapRow}>
                {FORMAT_OPTIONS.map((f) => {
                  const on = formats.includes(f);
                  return (
                    <Pressable
                      key={f}
                      onPress={() => toggleFormat(f)}
                      style={[
                        styles.chip,
                        {
                          borderColor: on ? colors.tint : cardBorder,
                          backgroundColor: on ? (isDark ? '#1e3a2f' : '#ecfdf5') : isDark ? '#26262c' : '#fff',
                        },
                      ]}>
                      <Text style={{ color: on ? colors.tint : colors.text, fontWeight: '700', fontSize: 13 }}>{f}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Açıklama (isteğe bağlı)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Kısa not"
                multiline
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={[
                  styles.input,
                  styles.inputTall,
                  { color: colors.text, borderColor: cardBorder, backgroundColor: isDark ? '#111' : '#fff' },
                ]}
              />

              <Pressable
                onPress={() => void onSave()}
                disabled={saving}
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.tint, opacity: saving ? 0.7 : 1 },
                ]}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Modeli vitrine ekle</Text>
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                lightImpact();
                router.back();
              }}
              style={[styles.btnWide, { borderColor: cardBorder, marginBottom: 4 }]}>
              <Text style={[styles.btnText, { color: colors.tint }]}>Kapat</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 28 + insets.bottom,
        }}
        style={{ flex: 1, backgroundColor: colors.background }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.listRow,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}>
            <ModelCoverImage
              source={item.coverImage}
              accent={item.accent}
              fallbackLetter={item.title.slice(0, 1).toUpperCase()}
              style={styles.thumb}
            />
            <View style={styles.listMeta}>
              <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}>{item.category}</Text>
              <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 4 }}>{formatTry(item.price)}</Text>
            </View>
            <Pressable
              onPress={() => onDelete(item.id, item.title)}
              style={[styles.delBtn, { borderColor: '#b91c1c' }]}>
              <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 12 }}>Sil</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: isDark ? '#64748b' : '#94a3b8', paddingHorizontal: 4, marginTop: 8 }}>
            Bu telefonda henüz kişisel model yok; yukarıdaki formdan ekleyin.
          </Text>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  blockTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  para: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnWide: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputTall: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  listMeta: {
    flex: 1,
    minWidth: 0,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  delBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
