# @kodai-yamamoto-siw/code-preview

DocusaurusやReactサイトで使える、初心者向けのHTML/CSSライブプレビュー用コンポーネントです。

## 特長
- HTMLとCSSを並べて編集し、下段でプレビュー
- ダーク/ライトに対応（propで指定）
- Monaco Editor採用

## インストール
```
pnpm add @kodai-yamamoto-siw/code-preview
# or
npm i @kodai-yamamoto-siw/code-preview
```

## 使い方
```tsx
import { CodePreview } from '@kodai-yamamoto-siw/code-preview';
import '@kodai-yamamoto-siw/code-preview/styles.css';

export default function Sample() {
  return (
    <CodePreview 
      initialHTML="<p>こんにちは</p>"
      initialCSS="p { color: red; }"
      title="サンプル"
      theme="light"
    />
  );
}
```

- initialHTML: HTMLのbody部分だけを入れてください（<!DOCTYPE>や<html>は不要）
- initialCSS: CSSを入れるとCSSエディタが表示されます
- imageBasePath: 画像を相対パスで読みたいときのベースパス
- theme: 'light' | 'dark'

## ライセンス
MIT
