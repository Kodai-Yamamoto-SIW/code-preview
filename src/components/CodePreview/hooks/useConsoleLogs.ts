import { useState, useEffect } from 'react';

/**
 * コンソールログメッセージの型定義
 */
interface ConsoleLogMessage {
    type: 'codePreviewConsoleLog';
    messages: string[];
}

/**
 * iframeからのコンソールログを受信・管理するフック
 * 
 * @param iframeRef 監視対象のiframeのRef
 * @param dependencies ログをクリアするトリガーとなる依存配列
 */
export const useConsoleLogs = (iframeRef: React.RefObject<HTMLIFrameElement | null>, dependencies: unknown[] = []) => {
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

    // 依存関係が変更されたらログをクリア（コード変更時など）
    useEffect(() => {
        setConsoleLogs([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // 自身のiframeからのメッセージ以外は無視
            if (event.source !== iframeRef.current?.contentWindow) return;
            
            const data = event.data as Partial<ConsoleLogMessage>;
            
            if (!data || typeof data !== 'object') return;
            
            if (data.type === 'codePreviewConsoleLog' && Array.isArray(data.messages)) {
                setConsoleLogs(data.messages);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [iframeRef]);

    return {
        consoleLogs,
        setConsoleLogs
    };
};
