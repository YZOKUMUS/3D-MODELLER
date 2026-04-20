import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { useLikes } from '@/context/LikesContext';
import { usePersonalModels } from '@/context/PersonalModelsContext';
import { CATEGORIES, type CatalogModel, type ModelCategory } from '@/data/catalog';
import { formatTry } from '@/lib/format';
import { lightImpact } from '@/lib/haptics';

const FORMAT_OPTIONS = ['GLB', 'OBJ', 'FBX', 'STL', 'STEP'] as const;

export default function ResimEkleTabScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const {
    supportsPersonal,
    personalOnlyAsModels,
    addFromPicker,
    deletePersonal,
    clearAllPersonal,
    updatePersonal,
    removePersonalImage,
    hideBundledCatalog,
    setHideBundledCatalog,
  } = usePersonalModels();
  const { clearAllLikes } = useLikes();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ModelCategory>(CATEGORIES[0]);
  const [formats, setFormats] = useState<string[]>(['GLB']);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [galleryUris, setGalleryUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<ModelCategory>(CATEGORIES[0]);
  const [editFormats, setEditFormats] = useState<string[]>(['GLB']);
  const [editSaving, setEditSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const editingModel = useMemo(
    () => (editingId ? personalOnlyAsModels.find((m) => m.id === editingId) ?? null : null),
    [editingId, personalOnlyAsModels],
  );

  const cardBg = isDark ? '#1a1a1e' : '#f8fafc';
  const cardBorder = isDark ? '#2d2d35' : '#e2e8f0';
  const listPadBottom = tabBarHeight + insets.bottom + 20;

  const toggleFormat = (f: string) => {
    lightImpact();
    setFormats((prev) => {
      const has = prev.includes(f);
      if (has && prev.length === 1) return prev;
      if (has) return prev.filter((x) => x !== f);
      return [...prev, f];
    });
  };

  const toggleEditFormat = (f: string) => {
    lightImpact();
    setEditFormats((prev) => {
      const has = prev.includes(f);
      if (has && prev.length === 1) return prev;
      if (has) return prev.filter((x) => x !== f);
      return [...prev, f];
    });
  };

  const openEdit = useCallback((item: CatalogModel) => {
    lightImpact();
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditPrice(String(item.price));
    setEditDescription(item.description ?? '');
    setEditCategory(item.category);
    setEditFormats(item.formats.length > 0 ? [...item.formats] : ['GLB']);
  }, []);

  const closeEdit = useCallback(() => {
    if (editSaving || photoBusy) return;
    setEditingId(null);
  }, [editSaving, photoBusy]);

  const runRemoveCover = useCallback(async () => {
    if (!editingId) return;
    setPhotoBusy(true);
    try {
      const r = await removePersonalImage(editingId, { kind: 'cover' });
      if (!r.ok) Alert.alert('Hata', r.message);
      else lightImpact();
    } finally {
      setPhotoBusy(false);
    }
  }, [editingId, removePersonalImage]);

  const requestRemoveCover = useCallback(() => {
    const gal = editingModel?.galleryImages ?? [];
    if (gal.length === 0) {
      Alert.alert(
        'Kapak kaldırılamaz',
        'Yalnızca tek fotoğraf kaldı. Tüm modeli silmek için listede Sil kullan.',
      );
      return;
    }
    Alert.alert('Kapak kaldırılsın mı?', 'İlk galeri görseli yeni kapak olur.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kaldır', style: 'destructive', onPress: () => void runRemoveCover() },
    ]);
  }, [editingModel, runRemoveCover]);

  const runRemoveGallery = useCallback(
    async (index: number) => {
      if (!editingId) return;
      setPhotoBusy(true);
      try {
        const r = await removePersonalImage(editingId, { kind: 'gallery', index });
        if (!r.ok) Alert.alert('Hata', r.message);
        else lightImpact();
      } finally {
        setPhotoBusy(false);
      }
    },
    [editingId, removePersonalImage],
  );

  const requestRemoveGallery = useCallback(
    (index: number) => {
      Alert.alert('Bu görsel kaldırılsın mı?', `Galeri fotoğrafı ${index + 1}`, [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Kaldır', style: 'destructive', onPress: () => void runRemoveGallery(index) },
      ]);
    },
    [runRemoveGallery],
  );

  const onSaveEdit = useCallback(async () => {
    if (!editingId) return;
    const t = editTitle.trim();
    if (!t) {
      Alert.alert('Eksik', 'Model adı girin.');
      return;
    }
    const p = parseInt(editPrice.replace(/\s/g, ''), 10);
    if (!Number.isFinite(p) || p < 0) {
      Alert.alert('Eksik', 'Geçerli bir fiyat (tam sayı) girin.');
      return;
    }
    if (editFormats.length === 0) {
      Alert.alert('Eksik', 'En az bir dosya formatı seçin.');
      return;
    }
    setEditSaving(true);
    try {
      const result = await updatePersonal(editingId, {
        title: t,
        price: p,
        category: editCategory,
        description: editDescription.trim(),
        formats: editFormats,
      });
      if (result.ok) {
        lightImpact();
        setEditingId(null);
        Alert.alert('Tamam', 'Model güncellendi.');
      } else {
        Alert.alert('Hata', result.message);
      }
    } finally {
      setEditSaving(false);
    }
  }, [editingId, editTitle, editPrice, editCategory, editDescription, editFormats, updatePersonal]);

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
  }, [supportsPersonal, title, price, coverUri, formats, category, description, galleryUris, addFromPicker]);

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

  const onClearAllPersonal = () => {
    const n = personalOnlyAsModels.length;
    const body =
      n > 0
        ? `${n} kayıt ve cihaza kopyalanan görseller kaldırılır. Uygulama paketindeki hazır vitrin modelleri silinmez.`
        : 'Listede kayıt görünmese bile cihazda kalan kişisel kopya görseller varsa onlar da temizlenir. Hazır vitrin katalogu silinmez.';
    Alert.alert(n > 0 ? 'Tüm kişisel modeller silinsin mi?' : 'Kişisel depo temizlensin mi?', body, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: n > 0 ? 'Hepsini sil' : 'Temizle',
        style: 'destructive',
        onPress: () => {
          lightImpact();
          void clearAllPersonal();
        },
      },
    ]);
  };

  const onFullFreshStart = () => {
    Alert.alert(
      'Tam yeni başlangıç?',
      'Paket içi örnek vitrin Modeller sekmesinde gizlenir; bu telefona eklediğin kişisel kayıtlar ve kopya görseller silinir; kalpli beğeniler sıfırlanır. Sonra listede yalnızca yeniden eklediklerin görünür. İstersen aşağıdan paket vitrinini tekrar açabilirsin.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, sıfırla',
          style: 'destructive',
          onPress: () => {
            lightImpact();
            void (async () => {
              await clearAllPersonal();
              await setHideBundledCatalog(true);
              await clearAllLikes();
            })();
          },
        },
      ],
    );
  };

  const webBlock = useMemo(
    () => (
      <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.blockTitle, { color: colors.text }]}>Yalnızca telefon</Text>
        <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Bu ekran Android veya iOS uygulamasında çalışır. Web önizlemesinde katalog düzenlenemez; model eklemek
          için Expo Go veya derlenmiş APK ile açın.
        </Text>
      </View>
    ),
    [cardBg, cardBorder, colors.text, isDark],
  );

  if (Platform.OS === 'web') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: listPadBottom }}>
        {webBlock}
      </ScrollView>
    );
  }

  const modalMaxH = Dimensions.get('window').height * 0.88;

  return (
    <>
      <FlatList
      data={personalOnlyAsModels}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={{ gap: 14, paddingBottom: 8 }}>
          <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.blockTitle, { color: colors.text, fontSize: 15 }]}>Bu sekmedeki liste</Text>
            <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#64748b', marginBottom: 0 }]}>
              Sadece bu telefonda &quot;Modeli vitrine ekle&quot; ile kaydettiğin modeller burada görünür. Modeller
              sekmesindeki hazır vitrin burada listelenmez. Kayıtların varsa aşağı kaydır; her satırda &quot;Sil&quot;
              vardır.
            </Text>
          </View>

          <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.blockTitle, { color: colors.text, fontSize: 15 }]}>Modeller sekmesini sıfırla</Text>
            <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Telefonda çekip kaydetmediklerin (uygulama paketindeki örnek vitrin) Modeller listesinde gizlenir; kişisel
              kayıtlar ve beğeniler temizlenir. Sonra yalnızca buradan eklediklerin görünür. Paket vitrinini geri
              açmak için ekranın en altındaki düğmeyi kullanın.
            </Text>
            <Pressable
              onPress={onFullFreshStart}
              style={[styles.btnWide, { borderColor: '#b45309', backgroundColor: isDark ? '#2a1f0a' : '#fffbeb' }]}>
              <Text style={[styles.btnText, { color: '#b45309' }]}>Tam yeni başlangıç (sadece kendi vitrinin)</Text>
            </Pressable>
          </View>

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
              Seçim sırası önemli: ilk foto liste kapaklarında, sonrakiler detay galerisinde 2., 3., … sırayla çıkar.
              Tek foto seçersen sadece kapak olur.
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
              Galeride birden fazla foto seç. Aynı düğmeye tekrar basınca yeni seçimler eklenir (en fazla 12).
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
              style={[styles.saveBtn, { backgroundColor: colors.tint, opacity: saving ? 0.7 : 1 }]}>
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
              router.replace('/(tabs)' as Parameters<typeof router.replace>[0]);
            }}
            style={[styles.btnWide, { borderColor: cardBorder, marginBottom: 4 }]}>
            <Text style={[styles.btnText, { color: colors.tint }]}>Modeller listesine git</Text>
          </Pressable>
        </View>
      }
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: listPadBottom,
      }}
      style={{ flex: 1, backgroundColor: colors.background }}
      renderItem={({ item }) => (
        <View style={[styles.listRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.listRowTop}>
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
          </View>
          <View style={styles.listActionsRow}>
            <Pressable
              onPress={() => openEdit(item)}
              style={[styles.editBtnRow, { borderColor: colors.tint, backgroundColor: isDark ? '#16231c' : '#ecfdf5' }]}>
              <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 14 }}>Düzenle</Text>
            </Pressable>
            <Pressable
              onPress={() => onDelete(item.id, item.title)}
              style={[styles.delBtnRow, { borderColor: '#b91c1c', backgroundColor: isDark ? '#1c1010' : '#fff8f8' }]}>
              <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 14 }}>Sil</Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={{ marginTop: 4 }}>
          <Text style={{ color: isDark ? '#64748b' : '#94a3b8', paddingHorizontal: 4 }}>
            Bu telefonda henüz kişisel model yok; yukarıdaki formdan ekleyin.
            {hideBundledCatalog
              ? ' Paket vitrini şu an kapalı; Modeller sekmesinde yalnızca buradan eklediklerin listelenir. Açmak için en alttaki «Paket vitrinini tekrar göster»e basın.'
              : ' Modeller sekmesinde gördüklerin uygulama paketinden gelir; tam sıfırlamak için üstteki turuncu düğmeyi kullanın.'}
          </Text>
        </View>
      }
      ListFooterComponent={
        <View style={{ marginTop: 18, marginBottom: 8 }}>
          <Pressable
            onPress={onClearAllPersonal}
            style={[styles.btnWide, { borderColor: '#b91c1c', backgroundColor: isDark ? '#1c1010' : '#fff8f8' }]}>
            <Text style={[styles.btnText, { color: '#dc2626', fontWeight: '800' }]}>
              {personalOnlyAsModels.length > 0
                ? 'Tüm kişisel modelleri sil (baştan başla)'
                : 'Kişisel depoyu / kalan dosyaları temizle'}
            </Text>
          </Pressable>
          <Text style={[styles.hint, { color: isDark ? '#64748b' : '#94a3b8', marginTop: 8, textAlign: 'center' }]}>
            Sadece bu telefonda eklediklerin silinir; projedeki sabit katalog aynı kalır.
          </Text>
          {hideBundledCatalog ? (
            <Pressable
              onPress={() => {
                lightImpact();
                void setHideBundledCatalog(false);
              }}
              style={[
                styles.btnWide,
                {
                  borderColor: colors.tint,
                  backgroundColor: isDark ? '#16231c' : '#ecfdf5',
                  marginTop: 20,
                },
              ]}>
              <Text style={[styles.btnText, { color: colors.tint }]}>Paket vitrinini tekrar göster</Text>
            </Pressable>
          ) : null}
        </View>
      }
      />

      <Modal
        visible={editingId !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEdit}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}>
          <View style={styles.modalLayer}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={closeEdit}
              disabled={editSaving || photoBusy}
            />
            <View pointerEvents="box-none" style={styles.modalCenter}>
              <View
                pointerEvents="auto"
                style={[
                  styles.modalCard,
                  {
                    maxHeight: modalMaxH,
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Modeli düzenle</Text>
            <Text style={[styles.hint, { color: isDark ? '#94a3b8' : '#64748b', marginBottom: 10 }]}>
              Metin alanlarını değiştir; aşağıdan tek tek görsel de kaldırabilirsin. Yeni foto eklemek şimdilik ana
              ekrandan yeni model oluşturmayı gerektirir.
            </Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}>
              {editingModel ? (
                <View style={{ marginBottom: 14 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Görseller</Text>
                  <Text style={[styles.hint, { color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8 }]}>
                    Galeriden birini kaldırırsan liste buna göre güncellenir. Kapak kaldırırsan sıradaki galeri görseli
                    kapak olur (en az bir galeri fotoğrafı gerekir).
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.editPhotoStrip}>
                    <View style={styles.editPhotoTile}>
                      <Text style={[styles.editPhotoBadge, { color: colors.text }]}>Kapak</Text>
                      <ModelCoverImage
                        source={editingModel.coverImage}
                        accent={editingModel.accent}
                        fallbackLetter="?"
                        style={styles.editPhotoThumb}
                      />
                      <Pressable
                        onPress={requestRemoveCover}
                        disabled={photoBusy || !(editingModel.galleryImages?.length)}
                        style={[
                          styles.editPhotoRemove,
                          {
                            borderColor: '#b91c1c',
                            opacity: photoBusy || !(editingModel.galleryImages?.length) ? 0.45 : 1,
                          },
                        ]}>
                        <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 12 }}>Kaldır</Text>
                      </Pressable>
                    </View>
                    {(editingModel.galleryImages ?? []).map((src, idx) => (
                      <View key={`edit-g-${idx}`} style={styles.editPhotoTile}>
                        <Text style={[styles.editPhotoBadge, { color: colors.text }]}>Galeri {idx + 1}</Text>
                        <ModelCoverImage
                          source={src}
                          accent={editingModel.accent}
                          fallbackLetter="?"
                          style={styles.editPhotoThumb}
                        />
                        <Pressable
                          onPress={() => requestRemoveGallery(idx)}
                          disabled={photoBusy}
                          style={[
                            styles.editPhotoRemove,
                            { borderColor: '#b91c1c', opacity: photoBusy ? 0.45 : 1 },
                          ]}>
                          <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 12 }}>Kaldır</Text>
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <Text style={[styles.label, { color: colors.text }]}>Model adı</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Model adı"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: cardBorder, backgroundColor: isDark ? '#111' : '#fff' },
                ]}
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Fiyat (TL)</Text>
              <TextInput
                value={editPrice}
                onChangeText={setEditPrice}
                placeholder="199"
                keyboardType="number-pad"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: cardBorder, backgroundColor: isDark ? '#111' : '#fff' },
                ]}
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {CATEGORIES.map((c) => {
                  const on = c === editCategory;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => {
                        lightImpact();
                        setEditCategory(c);
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

              <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Formatlar</Text>
              <View style={styles.wrapRow}>
                {FORMAT_OPTIONS.map((f) => {
                  const on = editFormats.includes(f);
                  return (
                    <Pressable
                      key={f}
                      onPress={() => toggleEditFormat(f)}
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

              <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Açıklama (isteğe bağlı)</Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Kısa not"
                multiline
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={[
                  styles.input,
                  styles.inputTall,
                  { color: colors.text, borderColor: cardBorder, backgroundColor: isDark ? '#111' : '#fff' },
                ]}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeEdit}
                disabled={editSaving || photoBusy}
                style={[
                  styles.btnWide,
                  { borderColor: cardBorder, flex: 1, opacity: editSaving || photoBusy ? 0.6 : 1 },
                ]}>
                <Text style={[styles.btnText, { color: colors.text }]}>İptal</Text>
              </Pressable>
              <Pressable
                onPress={() => void onSaveEdit()}
                disabled={editSaving || photoBusy}
                style={[
                  styles.btnWide,
                  {
                    backgroundColor: colors.tint,
                    borderColor: colors.tint,
                    flex: 1,
                    opacity: editSaving || photoBusy ? 0.7 : 1,
                  },
                ]}>
                {editSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.btnText, { color: '#fff' }]}>Kaydet</Text>
                )}
              </Pressable>
            </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  listRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
  listActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  editBtnRow: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delBtnRow: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: {
    flex: 1,
  },
  modalLayer: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editPhotoStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
    paddingRight: 4,
  },
  editPhotoTile: {
    width: 108,
    alignItems: 'center',
  },
  editPhotoBadge: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  editPhotoThumb: {
    width: 96,
    height: 96,
    borderRadius: 10,
  },
  editPhotoRemove: {
    marginTop: 8,
    alignSelf: 'stretch',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
