import React from 'react';
import type { EditorKey } from '../types';

interface ExtractedCodeBlocks {
    html?: string;
    css?: string;
    js?: string;
}

export interface ParsedCodeBlocks {
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
}

const LANGUAGE_ALIASES: Record<string, EditorKey> = {
    html: 'html',
    css: 'css',
    js: 'js',
    javascript: 'js'
};

const extractLanguage = (className?: string, language?: string, lang?: string): EditorKey | undefined => {
    const explicit = (language || lang)?.toLowerCase();
    if (explicit && LANGUAGE_ALIASES[explicit]) {
        return LANGUAGE_ALIASES[explicit];
    }

    if (!className) return undefined;
    const match = className.match(/language-([a-z0-9_-]+)/i);
    if (!match) return undefined;

    const normalized = match[1].toLowerCase();
    return LANGUAGE_ALIASES[normalized];
};

const extractText = (node: React.ReactNode): string => {
    let text = '';

    React.Children.forEach(node, child => {
        if (typeof child === 'string' || typeof child === 'number') {
            text += String(child);
            return;
        }
        if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
            text += extractText(child.props.children);
        }
    });

    return text;
};

const extractCodeFromNode = (node: React.ReactElement): string => {
    const props = node.props as {
        children?: React.ReactNode;
        code?: string;
        value?: string;
    };
    if (typeof props.code === 'string') {
        return props.code;
    }
    if (typeof props.value === 'string') {
        return props.value;
    }
    return extractText(props.children);
};

const parseFencedBlocks = (raw: string): ExtractedCodeBlocks => {
    const result: ExtractedCodeBlocks = {};
    const regex = /```([a-z0-9_-]+)[ \t]*\r?\n([\s\S]*?)```/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(raw)) !== null) {
        const language = LANGUAGE_ALIASES[match[1].toLowerCase()];
        if (!language) {
            continue;
        }
        if (result[language] === undefined) {
            result[language] = match[2];
        }
    }

    return result;
};

const collectCodeBlocks = (node: React.ReactNode, result: ExtractedCodeBlocks, rawSegments: string[]) => {
    if (node === null || node === undefined) return;

    if (Array.isArray(node)) {
        node.forEach(child => collectCodeBlocks(child, result, rawSegments));
        return;
    }

    if (typeof node === 'string' || typeof node === 'number') {
        rawSegments.push(String(node));
        return;
    }

    if (!React.isValidElement(node)) return;

    const { className, children, language, lang } = node.props as {
        className?: string;
        children?: React.ReactNode;
        language?: string;
        lang?: string;
    };
    const detected = extractLanguage(className, language, lang);

    if (detected && result[detected] === undefined) {
        result[detected] = extractCodeFromNode(node);
        return;
    }

    collectCodeBlocks(children, result, rawSegments);
};

export const parseCodeBlocksFromChildren = (children: React.ReactNode): ParsedCodeBlocks => {
    const result: ExtractedCodeBlocks = {};
    const rawSegments: string[] = [];
    collectCodeBlocks(children, result, rawSegments);

    const resolved =
        !result.html && !result.css && !result.js
            ? { ...result, ...parseFencedBlocks(rawSegments.join('')) }
            : result;

    return {
        initialHTML: resolved.html,
        initialCSS: resolved.css,
        initialJS: resolved.js,
    };
};
