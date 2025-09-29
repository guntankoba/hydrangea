# hydrangea

TypeScript で動作するパスワード保護付きの三段階謎解きアプリです。最終回答は「アメとアジサイ」になります。

## 開発フロー
- `npm install`
- `npm run dev` で TypeScript をウォッチビルド（出力先は `docs/assets`）
- 任意の静的ファイルサーバーで `docs/` をホストしてブラウザから `docs/index.html` を確認

## GitHub Pages への公開
1. リポジトリの Settings > Pages で Source を `main` ブランチ、フォルダーを `docs/` に設定
2. 反映後、`https://<ユーザー名>.github.io/<リポジトリ名>/` でアクセス可能
3. 問題文や回答は `src/main.ts` の `puzzles` 配列を編集して差し替え可能

## パスワードと体験要素
- 利用者用パスワードは `kobachi`
- 仮問ごとにヒントボタンを用意。表示後はボタンが無効化され、ヒント欄に内容が展開されます
- 誤答時のフィードバックや進捗インジケーターを実装済み
