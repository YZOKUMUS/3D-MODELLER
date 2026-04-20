import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { CATALOG, type CatalogModel, type ModelCategory } from '@/data/catalog';

const STORAGE_KEY = '@model_market_personal_models_v1';
const COVERS_DIR = 'personal-covers';

export type PersonalStoredRecord = {
  id: string;
  title: string;
  tagline: string;
  price: number;
  formats: string[];
  category: ModelCategory;
  description: string;
  coverFile: string;
  galleryFiles: string[];
  accent: string;
  polyCount: string;
  rating: number;
  createdAt: number;
};

function coversBaseDir(): string | null {
  const root = FileSystem.documentDirectory;
  if (!root) return null;
  return `${root}${COVERS_DIR}/`;
}

function storedToRuntime(base: string, p: PersonalStoredRecord): CatalogModel {
  return {
    id: p.id,
    title: p.title,
    tagline: p.tagline,
    price: p.price,
    formats: p.formats,
    category: p.category,
    description: p.description,
    coverImage: { uri: `${base}${p.coverFile}` },
    galleryImages:
      p.galleryFiles.length > 0 ? p.galleryFiles.map((f) => ({ uri: `${base}${f}` })) : undefined,
    accent: p.accent,
    polyCount: p.polyCount,
    rating: p.rating,
  };
}

const ACCENTS = ['#5B8DEF', '#C084FC', '#34D399', '#FBBF24', '#2DD4BF', '#94A3B8', '#f472b6', '#a78bfa'];

export type PersonalModelsContextValue = {
  ready: boolean;
  mergedCatalog: CatalogModel[];
  getModelById: (id: string) => CatalogModel | undefined;
  revision: number;
  personalOnlyAsModels: CatalogModel[];
  addFromPicker: (payload: {
    title: string;
    price: number;
    category: ModelCategory;
    description: string;
    formats: string[];
    coverUri: string;
    galleryUris: string[];
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  deletePersonal: (id: string) => Promise<void>;
  supportsPersonal: boolean;
};

const PersonalModelsContext = createContext<PersonalModelsContextValue | null>(null);

async function ensureCoversDir(): Promise<string | null> {
  const base = coversBaseDir();
  if (!base) return null;
  await FileSystem.makeDirectoryAsync(base, { intermediates: true }).catch(() => undefined);
  return base;
}

export function PersonalModelsProvider({ children }: { children: React.ReactNode }) {
  const supportsPersonal = Platform.OS === 'ios' || Platform.OS === 'android';
  const [records, setRecords] = useState<PersonalStoredRecord[]>([]);
  const recordsRef = useRef<PersonalStoredRecord[]>([]);
  const [ready, setReady] = useState(!supportsPersonal);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    if (!supportsPersonal) {
      setRecords([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (r): r is PersonalStoredRecord =>
                r != null &&
                typeof r === 'object' &&
                typeof (r as PersonalStoredRecord).id === 'string' &&
                typeof (r as PersonalStoredRecord).coverFile === 'string',
            );
            setRecords(cleaned);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supportsPersonal]);

  const baseDir = supportsPersonal ? coversBaseDir() : null;

  const personalOnlyAsModels = useMemo(() => {
    if (!supportsPersonal || !baseDir) return [];
    return records.map((p) => storedToRuntime(baseDir, p));
  }, [records, supportsPersonal, baseDir]);

  const mergedCatalog = useMemo(() => {
    if (!supportsPersonal || !baseDir) return CATALOG;
    const personal = records.map((p) => storedToRuntime(baseDir, p));
    return [...CATALOG, ...personal];
  }, [records, supportsPersonal, baseDir]);

  const getModelById = useCallback(
    (id: string) => mergedCatalog.find((m) => m.id === id),
    [mergedCatalog],
  );

  const addFromPicker = useCallback(
    async (payload: {
      title: string;
      price: number;
      category: ModelCategory;
      description: string;
      formats: string[];
      coverUri: string;
      galleryUris: string[];
    }): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (!supportsPersonal) return { ok: false, message: 'Bu özellik yalnızca Android veya iPhone uygulamasında.' };
      const base = await ensureCoversDir();
      if (!base) return { ok: false, message: 'Cihazda kayıt klasörü açılamadı.' };
      const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const stamp = Date.now();

      const copyIn = async (uri: string, suffix: string): Promise<string | null> => {
        const name = `${id}-${suffix}.jpg`;
        const dest = `${base}${name}`;
        try {
          await FileSystem.copyAsync({ from: uri, to: dest });
          return name;
        } catch {
          return null;
        }
      };

      const coverFile = await copyIn(payload.coverUri, 'cover');
      if (!coverFile) return { ok: false, message: 'Kapak fotoğrafı kaydedilemedi (dosya erişimi).' };

      const galleryFiles: string[] = [];
      let gi = 0;
      for (const gu of payload.galleryUris) {
        const fn = await copyIn(gu, `g${gi++}`);
        if (fn) galleryFiles.push(fn);
      }

      const title = payload.title.trim();
      const tagline = `${title} · ${payload.formats.join(', ')}`.slice(0, 240);
      setRecords((prev) => {
        const rec: PersonalStoredRecord = {
          id,
          title,
          tagline,
          price: Math.max(0, Math.floor(payload.price)),
          formats: payload.formats,
          category: payload.category,
          description: payload.description.trim() || `${title} modeli`,
          coverFile,
          galleryFiles,
          accent: ACCENTS[prev.length % ACCENTS.length],
          polyCount: '—',
          rating: 4.2,
          createdAt: stamp,
        };
        const next = [...prev, rec];
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setRevision((r) => r + 1);
      return { ok: true };
    },
    [supportsPersonal],
  );

  const deletePersonal = useCallback(async (id: string) => {
    if (!supportsPersonal) return;
    const base = coversBaseDir();
    if (!base) return;
    const rec = recordsRef.current.find((r) => r.id === id);
    if (!rec) return;
    for (const f of [rec.coverFile, ...rec.galleryFiles]) {
      await FileSystem.deleteAsync(`${base}${f}`, { idempotent: true }).catch(() => undefined);
    }
    setRecords((prev) => {
      const next = prev.filter((r) => r.id !== id);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setRevision((r) => r + 1);
  }, [supportsPersonal]);

  const value = useMemo(
    () => ({
      ready,
      mergedCatalog,
      getModelById,
      revision,
      personalOnlyAsModels,
      addFromPicker,
      deletePersonal,
      supportsPersonal,
    }),
    [
      ready,
      mergedCatalog,
      getModelById,
      revision,
      personalOnlyAsModels,
      addFromPicker,
      deletePersonal,
      supportsPersonal,
    ],
  );

  return <PersonalModelsContext.Provider value={value}>{children}</PersonalModelsContext.Provider>;
}

export function usePersonalModels(): PersonalModelsContextValue {
  const ctx = useContext(PersonalModelsContext);
  if (!ctx) {
    throw new Error('usePersonalModels must be used within PersonalModelsProvider');
  }
  return ctx;
}
