import { SourceCodeState } from './types';

// sourceIdごとの初期コード・画像・パスを保存するグローバルストア
const sourceCodeStore = new Map<string, SourceCodeState>();

// ストア更新を購読するリスナー
type StoreListener = () => void;
const storeListeners = new Map<string, Set<StoreListener>>();

// ストア更新を通知する関数
export const notifyStoreUpdate = (sourceId: string) => {
    const listeners = storeListeners.get(sourceId);
    if (listeners) {
        listeners.forEach(listener => listener());
    }
};

export const getStoredSource = (sourceId: string): SourceCodeState | undefined => {
    return sourceCodeStore.get(sourceId);
};

export const setStoredSource = (sourceId: string, state: SourceCodeState) => {
    sourceCodeStore.set(sourceId, state);
};

export const subscribeToStore = (sourceId: string, listener: StoreListener) => {
    if (!storeListeners.has(sourceId)) {
        storeListeners.set(sourceId, new Set());
    }
    storeListeners.get(sourceId)!.add(listener);

    return () => {
        storeListeners.get(sourceId)?.delete(listener);
    };
};
