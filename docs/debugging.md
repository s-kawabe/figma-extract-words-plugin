# Figma プラグインのデバッグ方法

## 1. プラグインの読み込み

Figma Desktop アプリで:

1. **Plugins → Development → Import plugin from manifest...** を選択
2. プロジェクトルートの `manifest.json` を指定
3. 以降、**Plugins → Development → Extract Words Plugin** で実行可能

## 2. DevTools を開く

プラグイン実行中に開発者ツールを開く:

- **Mac**: `Cmd + Option + I`（Figma Desktop 内で）
- または **Plugins → Development → Open console** メニュー

Chrome DevTools と同等のツールが開き、`console.log` の出力・DOM・ネットワークの確認ができる。

## 3. ログの仕込み方

### UI 側（`ui-src/App.tsx` など）

```tsx
console.log("received texts:", texts);
```

### Plugin 側（`plugin-src/code.ts`）

```ts
console.log("current page:", figma.currentPage.name);
console.log("found nodes:", walkTextNodes(figma.currentPage).length);
```

どちらも同じ DevTools の Console タブに出力される。

## 4. Watch モードで開発

```bash
npm run dev
```

ファイル変更を自動検知してリビルドする。リビルド後、Figma 側でプラグインを再実行すれば変更が反映される。

- `Cmd + Option + P` — 前回のプラグインを素早く再実行

## 5. よくあるトラブルと確認方法

| 問題 | 確認方法 |
|---|---|
| UI が表示されない | DevTools Console でエラー確認。`dist/index.html` が存在するか確認 |
| テキストが取得できない | `code.ts` に `console.log` を追加して `walkTextNodes` の結果を確認 |
| メッセージが届かない | 送信側・受信側両方に `console.log` を入れて `postMessage` の経路を追跡 |
| ビルドエラー | ターミナルの `npm run dev` の出力を確認 |

## 6. ブレークポイント

DevTools の **Sources** タブで UI 側の JavaScript にブレークポイントを設定できる。`vite-plugin-singlefile` でインライン化されているため、コードは `index.html` 内に埋め込まれた形になる。
