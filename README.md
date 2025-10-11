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
- htmlVisible / cssVisible / jsVisible: true または false を渡すと、それぞれのエディタ表示を強制的に切り替えられます（省略時は自動判定）
- previewVisible: プレビュー領域の表示/非表示を制御できます（省略時は HTML エディタの状態に追従）
- consoleVisible: コンソール領域の表示/非表示を制御できます（true の場合はログが無くても表示されます）
- sourceId: 同じコードを複数の CodePreview で共有するためのID（詳細は下記）

### sourceId による複数インスタンスでのコード共有

同じ `sourceId` を持つ複数の `CodePreview` を配置すると、最初のインスタンスで指定した `initialHTML/CSS/JS` が2つ目以降でも自動的に使われます。

```tsx
// 1つ目: コードを定義
<CodePreview 
  sourceId="sample-code"
  initialHTML="<p>共有コード</p>"
  initialCSS="p { color: blue; }"
  title="編集例1"
/>

// 2つ目: sourceIdのみ指定（コードは1つ目と同じ）
<CodePreview 
  sourceId="sample-code"
  title="編集例2"
/>

// 3つ目: sourceIdを指定しつつ、一部を上書きも可能
<CodePreview 
  sourceId="sample-code"
  initialCSS="p { color: red; }"
  title="編集例3（CSSだけ変更）"
/>
```

これにより、同じコードで異なる見せ方（タイトルや表示制御を変える）をする場合に便利です。

メモ:
- `initialJS` はプレビュー内の `<script>` として実行されます。プレビュー用途のため、エラー処理や型チェックは行いません。

## ライセンス
MIT
