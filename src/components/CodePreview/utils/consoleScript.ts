export const CONSOLE_INTERCEPT_SCRIPT = `
(function () {
if (!window.parent) return;
const logs = [];
const MAX_HTML_LENGTH = 300;
const INTERNAL_SCRIPT_SELECTOR = 'script[data-code-preview-internal]';

const currentScript = document.currentScript;

const removeInternalScripts = root => {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    try {
        const scripts = root.querySelectorAll(INTERNAL_SCRIPT_SELECTOR);
        for (let index = 0; index < scripts.length; index++) {
            const script = scripts[index];
            if (!script || script === currentScript) continue;
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }
    } catch (error) {
        // noop
    }
};

const removeCurrentScript = () => {
    if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.removeChild(currentScript);
    }
};

removeInternalScripts(document);
removeCurrentScript();

const postLogs = () => {
    try {
        window.parent.postMessage({ type: 'codePreviewConsoleLog', messages: logs.slice() }, '*');
    } catch (error) {
        // noop
    }
};

const extractStackLocation = stack => {
    if (!stack) return '';
    try {
        const text = String(stack);
        const jsMatch = text.match(/(code-preview-js\\.js:\\d+:\\d+)/);
        if (jsMatch && jsMatch[1]) return ' (' + jsMatch[1] + ')';
        const htmlMatch = text.match(/(about:srcdoc:\\d+:\\d+)/);
        if (htmlMatch && htmlMatch[1]) return ' (' + htmlMatch[1] + ')';
    } catch (error) {
        // noop
    }
    return '';
};

const truncate = text => {
    if (typeof text !== 'string') return text;
    if (text.length <= MAX_HTML_LENGTH) return text;
    return text.slice(0, MAX_HTML_LENGTH) + '…';
};

const describeElement = element => {
    try {
        const tag = element.tagName ? element.tagName.toLowerCase() : 'element';
        const id = element.id ? '#' + element.id : '';
        let classInfo = '';
        if (element.className && typeof element.className === 'string' && element.className.trim()) {
            classInfo = '.' + element.className.trim().split(/\\s+/).join('.');
        }
        const summary = '<' + tag + id + classInfo + '>';
        const outer = element.outerHTML;
        if (outer) return truncate(outer);
        return summary;
    } catch (error) {
        return '<要素>';
    }
};

const describeNode = node => {
    if (node === null) return 'null';
    if (node === undefined) return 'undefined';

    if (typeof Node !== 'undefined' && node instanceof Node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const textContent = node.textContent || '';
            return 'テキスト("' + truncate(textContent.trim()) + '")';
        }

        if (node.nodeType === Node.COMMENT_NODE) {
            return '<!-- ' + truncate(node.textContent || '') + ' -->';
        }

        if (typeof Element !== 'undefined' && node instanceof Element) {
            return describeElement(node);
        }

        if (typeof Document !== 'undefined' && node instanceof Document) {
            const html = node.documentElement ? node.documentElement.outerHTML || '' : '';
            return html ? truncate(html) : 'ドキュメント';
        }

        if (typeof DocumentFragment !== 'undefined' && node instanceof DocumentFragment) {
            return 'ドキュメントフラグメント';
        }
    }

    return String(node);
};

const describeCollection = collection => {
    try {
        const arr = Array.from(collection);
        const items = arr.map(item => describeNode(item)).join(', ');
        return '[' + items + ']';
    } catch (error) {
        return String(collection);
    }
};

const formatValue = val => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return '"' + truncate(val) + '"';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return String(val);
    if (typeof val === 'function') return '関数';
    if (Array.isArray(val)) {
        return '[' + val.map(formatValue).join(', ') + ']';
    }
    if (typeof NodeList !== 'undefined' && val instanceof NodeList) return describeCollection(val);
    if (typeof HTMLCollection !== 'undefined' && val instanceof HTMLCollection) return describeCollection(val);
    if (typeof Node !== 'undefined' && val instanceof Node) return describeNode(val);
    
    if (typeof val === 'object') {
        try {
            const keys = Object.keys(val);
            const props = keys.map(k => k + ': ' + formatValue(val[k])).join(', ');
            return '{' + props + '}';
        } catch (e) {
            return String(val);
        }
    }
    return String(val);
};

const originalLog = console.log;
console.log = function (...args) {
    logs.push(args.map(formatValue).join(' '));
    postLogs();
    originalLog.apply(console, args);
};

const originalError = console.error;
console.error = function (...args) {
    logs.push('[エラー] ' + args.map(formatValue).join(' '));
    postLogs();
    originalError.apply(console, args);
};

window.onerror = function (msg, url, line, col, error) {
    logs.push('[エラー] ' + msg + (line ? ' (' + line + '行目)' : ''));
    postLogs();
};
})();
`;

// Script to observe height changes in iframe content and notify parent
export const HEIGHT_OBSERVER_SCRIPT = `
(function () {
if (!window.parent) return;

let lastReportedHeight = 0;

const getDocumentHeight = () => {
    return Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.body ? document.body.offsetHeight : 0,
        document.documentElement ? document.documentElement.clientHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0,
        document.documentElement ? document.documentElement.offsetHeight : 0
    );
};

const reportHeight = () => {
    const currentHeight = getDocumentHeight();
    if (currentHeight > lastReportedHeight) {
        lastReportedHeight = currentHeight;
        try {
            window.parent.postMessage({ type: 'codePreviewHeightChange', height: currentHeight }, '*');
        } catch (error) {
            // noop
        }
    }
};

// Observe DOM mutations
const mutationObserver = new MutationObserver(() => {
    setTimeout(reportHeight, 0);
});

// Observe element resizes
const resizeObserver = new ResizeObserver(() => {
    setTimeout(reportHeight, 0);
});

const startObserving = () => {
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });
    
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);
    
    // Initial report
    reportHeight();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
} else {
    startObserving();
}

// Also report on load (for images, etc.)
window.addEventListener('load', reportHeight);
})();
`;
