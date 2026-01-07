import { SourceCodeState } from './types';

export type StoreListener = () => void;

export interface ISourceCodeStore {
    get(sourceId: string): SourceCodeState | undefined;
    set(sourceId: string, state: SourceCodeState): void;
    subscribe(sourceId: string, listener: StoreListener): () => void;
    notify(sourceId: string): void;
}

export class SourceCodeStore implements ISourceCodeStore {
    private store = new Map<string, SourceCodeState>();
    private listeners = new Map<string, Set<StoreListener>>();

    public get(sourceId: string): SourceCodeState | undefined {
        return this.store.get(sourceId);
    }

    public set(sourceId: string, state: SourceCodeState): void {
        this.store.set(sourceId, state);
    }

    public subscribe(sourceId: string, listener: StoreListener): () => void {
        if (!this.listeners.has(sourceId)) {
            this.listeners.set(sourceId, new Set());
        }
        this.listeners.get(sourceId)!.add(listener);

        return () => {
            this.listeners.get(sourceId)?.delete(listener);
        };
    }

    public notify(sourceId: string): void {
        const listeners = this.listeners.get(sourceId);
        if (listeners) {
            listeners.forEach(listener => listener());
        }
    }
}

export const globalSourceCodeStore = new SourceCodeStore();

// Expose the store on window for tests and debugging.
if (typeof window !== 'undefined') {
    window.__CodePreviewStore__ = globalSourceCodeStore;
}

export const getStoredSource = (sourceId: string) => globalSourceCodeStore.get(sourceId);
export const setStoredSource = (sourceId: string, state: SourceCodeState) => globalSourceCodeStore.set(sourceId, state);
export const subscribeToStore = (sourceId: string, listener: StoreListener) => globalSourceCodeStore.subscribe(sourceId, listener);
export const notifyStoreUpdate = (sourceId: string) => globalSourceCodeStore.notify(sourceId);
