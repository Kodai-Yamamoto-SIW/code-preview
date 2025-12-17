import { useState, useEffect } from 'react';

export const useConsoleLogs = (iframeRef: React.RefObject<HTMLIFrameElement | null>, dependencies: any[] = []) => {
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

    useEffect(() => {
        setConsoleLogs([]);
    }, dependencies);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return;
            const data = event.data;
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
