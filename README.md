# @metyatech/code-preview

An HTML/CSS/JS live preview component for Docusaurus and React sites (beginner-friendly).

## Features

- Edit HTML/CSS/JavaScript side-by-side with a preview pane
- Light/Dark themes (via props)
- Powered by Monaco Editor

## Setup

### Installation

```bash
pnpm add @metyatech/code-preview
# or
npm i @metyatech/code-preview
```

## Usage

```tsx
import { CodePreview } from '@metyatech/code-preview';
import '@metyatech/code-preview/styles.css';

export default function Sample() {
  return (
    <CodePreview
      initialHTML="<p>Hello</p>"
      initialCSS="p { color: red; }"
      initialJS="document.querySelector('p')?.addEventListener('click', () => alert('clicked'))"
      title="Sample"
      theme="light"
      fileStructureVisible={true}
    />
  );
}
```

- `initialHTML`: only the body contents (no `<!DOCTYPE>` / `<html>` required)
- `initialCSS`: when provided, the CSS editor is shown
- `initialJS`: when provided, the JS editor is shown and injected as a `<script>` in the preview
- `imageBasePath`: base path for resolving relative image paths
- `theme`: `'light' | 'dark'`
- `htmlVisible` / `cssVisible` / `jsVisible`: force each editor panel visibility (default: auto)
- `previewVisible`: toggle the preview pane (default: follows HTML editor state)
- `consoleVisible`: toggle the console pane (when `true`, it shows even if there are no logs)
- `fileStructureVisible`: initial visibility for the file explorer pane
- `sourceId`: share code/file structure across multiple `CodePreview` instances
- `htmlPath` / `cssPath` / `jsPath`: sets virtual filenames/paths and enables relative imports
- `images`: map from virtual path to URL (e.g. `images={{ "img/sample.png": "/img/sample.png" }}`)

### File Explorer / Virtual File System

Providing filenames/paths (`htmlPath`, `cssPath`, `jsPath`, `images`) shows a file explorer UI.

- Example: `<CodePreview cssPath="css/style.css" images={{ "img/fence.png": "/static/img/fence.png" }} ... />`
- File structure is shared across instances when `sourceId` is provided
- Images appear in the file tree and are resolvable via relative paths from HTML/CSS/JS
- CSS `url(...)` is automatically transformed to the `images` mapping
- `fetch` and `<img src=...>` also work via the virtual files

#### Images Example

```tsx
<CodePreview
  initialHTML={`<img src="img/fence.png">`}
  initialCSS={`.bg { background: url('../img/fence.png'); }`}
  images={{ "img/fence.png": "/static/img/fence.png" }}
  ...
/>
```

### Panel Visibility Control

- Use `htmlVisible`, `cssVisible`, `jsVisible`, `previewVisible`, `consoleVisible` to control panel visibility
- Use `fileStructureVisible` to control the initial file explorer state

### Sharing Code with `sourceId`

When multiple `CodePreview` components share the same `sourceId`, the first instance defines the initial code/file structure, and subsequent instances reuse it by default.

```tsx
// 1st: define shared code
<CodePreview
  sourceId="sample-code"
  initialHTML="<p>Shared</p>"
  initialCSS="p { color: blue; }"
  title="Example 1"
/>

// 2nd: reuse by sourceId only
<CodePreview sourceId="sample-code" title="Example 2" />

// 3rd: override part of the code
<CodePreview
  sourceId="sample-code"
  initialCSS="p { color: red; }"
  title="Example 3 (CSS override)"
/>
```

Note: `initialJS` runs as a `<script>` in the preview (no error handling/type checking, since it's for preview use).

## Development Commands

- `npm run build`: build
- `npm test`: component tests (Chromium/all browsers)
- `npm run lint`: lint

## Environment Variables/Settings

None.

## Release/Deploy

```bash
npm publish
```

## License

MIT
