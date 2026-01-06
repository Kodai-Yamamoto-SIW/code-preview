# @metyatech/code-preview

DocusaurusやReactサイトで使える、初心者向けのHTML/CSSライブプレビュー用コンポーネントです。

## 特長
- HTML/CSS/JavaScript を並べて編集し、下段でプレビュー
- ダーク/ライトに対応（propで指定）
- Monaco Editor採用

## インストール
```
pnpm add @metyatech/code-preview
# or
npm i @metyatech/code-preview
```

## 使い方
```tsx
import { CodePreview } from '@metyatech/code-preview';
import '@metyatech/code-preview/styles.css';

export default function Sample() {
  return (
    <CodePreview 
      initialHTML="<p>こんにちは</p>"
      initialCSS="p { color: red; }"
      initialJS="document.querySelector('p')?.addEventListener('click', () => alert('clicked'))"
      title="サンプル"
  theme="light"
  fileStructureVisible={true} // ファイル構造エクスプローラを初期表示
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
- fileStructureVisible: ファイル構造（エクスプローラ）の初期表示状態を制御できます（trueで初期表示、falseで非表示）
- sourceId: 同じコードやファイル構造を複数の CodePreview で共有するためのID（詳細は下記）
- htmlPath / cssPath / jsPath: ファイル名・パスを指定すると、ファイル構造エクスプローラに反映され、HTML/CSS/JSの相対参照も可能
- images: 画像ファイルのパスとURLのマップ。例: images={{ "img/sample.png": "/img/sample.png" }}
### ファイル構造エクスプローラ・仮想ファイルシステム

ファイル名やパス（htmlPath, cssPath, jsPath, images）を指定すると、画面上にファイル構造エクスプローラが表示されます。

- 例: `<CodePreview cssPath="css/style.css" images={{ "img/fence.png": "/static/img/fence.png" }} ... />`
- ファイル構造は複数のCodePreview間（sourceId指定時）でも自動で共有されます
- 画像もファイル構造に表示され、HTML/CSS/JSから相対パスで参照できます
- CSSの `url(...)` も自動でimagesマッピングに変換されます
- fetchや<img src=...>も仮想ファイル経由で動作します

#### 画像の使い方例
```tsx
<CodePreview
  initialHTML={`<img src="img/fence.png">`}
  initialCSS={`.bg { background: url('../img/fence.png'); }`}
  images={{ "img/fence.png": "/static/img/fence.png" }}
  ...
/>
```

### パネル表示制御

- htmlVisible, cssVisible, jsVisible, previewVisible, consoleVisible で各パネルの表示/非表示を外部から制御できます
- fileStructureVisible でファイル構造の初期表示状態を制御できます

### 複数インスタンス・教材演習での利用

- sourceId を指定すると、コード・ファイル構造・画像もすべて共有されます
- 2つ目以降のCodePreviewでは、initialHTML/CSS/JSやimages、パス指定を省略しても1つ目の設定が自動で反映されます
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
