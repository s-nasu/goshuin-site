このプルリクエストは、プロジェクトの運用・開発フローを改善するための小さな運用ドキュメントと PM2 用設定を追加します。主な変更点:

- PM2 用の `ecosystem.config.js` を追加し、ログ書き出し先を `./logs/` に設定します。
- PM2 のログローテーションを簡単に導入するための npm スクリプト（`pm2:install-logrotate` / `pm2:configure-logrotate`）を追加しました。 <<<<<<< HEAD
- デプロイ手順の簡易スクリプト `scripts/deploy.sh` と `Makefile` を追加しました（ローカル/サーバーでの実行手順を README に記載）。
- systemd サービスのサンプル `contrib/goshuin-app.service` を追加しました（環境に合わせて `User` / `WorkingDirectory` を編集してください）。
- DB 型生成ツールとそれに伴う CI フローがプロジェクトに既に追加されています（生成型の差分を検出する CI と、自動 PR 作成の Workflow が含まれます）。

注意事項:

- デプロイ手順の簡易スクリプト `scripts/deploy.sh` と `Makefile` を追加しました（ローカル/サーバーでの実行手順を README に記載）。
- systemd サービスのサンプル `contrib/goshuin-app.service` を追加しました（環境に合わせて `User` / `WorkingDirectory` を編集してください）。
- DB 型生成ツールとそれに伴う CI フローがプロジェクトに既に追加されています（生成型の差分を検出する CI と、自動 PR 作成の Workflow が含まれます）。

レビューポイント候補:

- `ecosystem.config.js` のログ出力パスとパーミッション
- `scripts/deploy.sh` のバックアップ先と権限周り
- README の手順が現行運用と一致しているか

小さな改善やドキュメント修正は同じブランチに追加コミットで対応できます。

---

署名: 自動コミット (Assistant による追加)
