import { test, expect } from '@playwright/experimental-ct-react';
import { resolveUrl } from './urlResolver';

test.describe('urlResolver', () => {
    test('should return path as is if it is absolute or data uri', () => {
        expect(resolveUrl('/test.png')).toBe('/test.png');
        expect(resolveUrl('http://example.com/test.png')).toBe('http://example.com/test.png');
        expect(resolveUrl('https://example.com/test.png')).toBe('https://example.com/test.png');
        expect(resolveUrl('data:image/png;base64,...')).toBe('data:image/png;base64,...');
    });

    test('should return relative path as is without a map', () => {
        expect(resolveUrl('test.png')).toBe('test.png');
    });

    test('should resolve using resolvedImages map', () => {
        const resolvedImages = {
            'test.png': 'blob:url1',
            'img/test.png': 'blob:url2'
        };
        expect(resolveUrl('test.png', resolvedImages)).toBe('blob:url1');
        expect(resolveUrl('./test.png', resolvedImages)).toBe('blob:url1');
        expect(resolveUrl('img/test.png', resolvedImages)).toBe('blob:url2');
        expect(resolveUrl('../img/test.png', resolvedImages)).toBe('blob:url2');
    });

    test('should fallback to original path if not in resolvedImages', () => {
        const resolvedImages = {
            'other.png': 'blob:url1'
        };
        expect(resolveUrl('test.png', resolvedImages)).toBe('test.png');
    });
});
