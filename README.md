# @kodai-yamamoto-siw/code-preview

DocusaurusやReactサイトで使える、初心者向けのHTML/CSSライブプレビュー用コンポーネントです。

## 特長
- HTML/CSS/JavaScript を並べて編集し、下段でプレビュー
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
      initialJS="document.querySelector('p')?.addEventListener('click', () => alert('clicked'))"
      title="サンプル"
      theme="light"
    />
  );
}
```

- initialHTML: HTMLのbody部分だけを入れてください（<!DOCTYPE>や<html>は不要）
- initialCSS: CSSを入れるとCSSエディタが表示されます
- initialJS: JavaScript を入れると JS エディタが表示され、プレビューに `<script>` として挿入されます
- imageBasePath: 画像を相対パスで読みたいときのベースパス
- theme: 'light' | 'dark'

メモ:
- `initialJS` はプレビュー内の `<script>` として実行されます。プレビュー用途のため、エラー処理や型チェックは行いません。

## ライセンス
MIT
