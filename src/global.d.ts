import type { ISourceCodeStore } from './components/CodePreview/store';

declare global {
    interface Window {
        __CodePreviewStore__?: ISourceCodeStore;
    }
}

export {};
