import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = '@model_market_likes_v1';

type LikesState = {
  ready: boolean;
  isLiked: (modelId: string) => boolean;
  toggleLike: (modelId: string) => void;
  clearAllLikes: () => Promise<void>;
};

const LikesContext = createContext<LikesState | null>(null);

async function loadIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

async function saveIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadIds().then((loaded) => {
      if (!cancelled) {
        setIds(loaded);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const likedSet = useMemo(() => new Set(ids), [ids]);

  const isLiked = useCallback((modelId: string) => likedSet.has(modelId), [likedSet]);

  const toggleLike = useCallback((modelId: string) => {
    setIds((prev) => {
      const had = prev.includes(modelId);
      const next = had ? prev.filter((id) => id !== modelId) : [...prev, modelId];
      void saveIds(next);
      return next;
    });
  }, []);

  const clearAllLikes = useCallback(async () => {
    setIds([]);
    try {
      await saveIds([]);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      ready,
      isLiked,
      toggleLike,
      clearAllLikes,
    }),
    [ready, isLiked, toggleLike, clearAllLikes]
  );

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes(): LikesState {
  const ctx = useContext(LikesContext);
  if (!ctx) {
    throw new Error('useLikes must be used within LikesProvider');
  }
  return ctx;
}
