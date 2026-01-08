import { test, expect } from '@playwright/experimental-ct-react';
import { stripIndent, normalizeInitialCode } from './stringUtils';

test.describe('stringUtils', () => {
    test('stripIndent removes common indentation and trims blank lines', async () => {
        const input = '\n    <div>\n        <span>Hi</span>\n    </div>\n';
        const expected = '<div>\n    <span>Hi</span>\n</div>';
        expect(stripIndent(input)).toBe(expected);
    });

    test('stripIndent preserves indentation when the minimum indent is zero', async () => {
        const input = '\nA\n  B\n';
        const expected = 'A\n  B';
        expect(stripIndent(input)).toBe(expected);
    });

    test('stripIndent handles blank lines inside the content', async () => {
        const input = '\n  A\n\n  B\n';
        const expected = 'A\n\nB';
        expect(stripIndent(input)).toBe(expected);
    });

    test('stripIndent normalizes CRLF line endings', async () => {
        const input = '\r\n  A\r\n  B\r\n';
        const expected = 'A\nB';
        expect(stripIndent(input)).toBe(expected);
    });

    test('normalizeInitialCode leaves single-line strings unchanged', async () => {
        const input = '  <div></div>';
        expect(normalizeInitialCode(input)).toBe(input);
    });

    test('normalizeInitialCode keeps indentation when there is no common indent', async () => {
        const input = '\nA\n  B\n';
        expect(normalizeInitialCode(input)).toBe('A\n  B');
    });

    test('normalizeInitialCode returns undefined when input is undefined', async () => {
        expect(normalizeInitialCode(undefined)).toBeUndefined();
    });
});
