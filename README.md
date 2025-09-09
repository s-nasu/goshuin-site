# 御朱印めぐり管理帳 (Goshuin Logbook)

Read the English version: `README.en.md`

全国の寺社でいただいた御朱印を記録・管理するためのウェブアプリケーションです。

![アプリのスクリーンショット](public/images/screenshot.png) _(ここにアプリケーションのスクリーンショットを配置します。現在はダミー画像です)_

## 主な機能

- **寺社管理**:

  - 寺社の一覧表示
  - 新しい寺社の登録（名称、種類、都道府県、住所、地図座標、説明）
  - 登録済み寺社の詳細情報の閲覧

- **御朱印の記録**:

  - 参拝日、メモ、御朱印の画像をアップロードして記録
  - 寺社ごとに記録した御朱印を一覧表示

- **検索・閲覧**:
  - 地図上に登録した寺社をプロットして可視化
  - 都道府県別での寺社一覧表示

## 使用技術

- **バックエンド**: Node.js, Express
- **フロントエンド**: EJS (Embedded JavaScript templates)
- **データベース**: SQLite3
- **クエリビルダ**: Knex.js
- **その他**: Multer (ファイルアップロード)

## セットアップと実行方法

1.  **リポジトリをクローン:**

    ```bash
    git clone https://github.com/s-nasu/otomail.git
    cd otomail
    ```

2.  **依存関係をインストール:**

    ```bash
    npm install
    ```

3.  **データベースのセットアップ:** 以下のコマンドを実行して、テーブルを作成し、初期データ（都道府県マスタ）を投入します。

    ```bash
    # データベースのマイグレーションを実行
    npx knex migrate:latest

    # 初期データ（都道府県）を投入
    npx knex seed:run
    ```

    これにより、`db/` ディレクトリに `goshuin.sqlite3` というデータベースファイルが生成されます。

4.  **アプリケーションの起動:**

    ```bash
    node index.js
    ```

5.  **ブラウザでアクセス:** サーバーが起動したら、ウェブブラウザで `http://localhost:3000` を開いてください。

## データベース設計

このアプリケーションは 3 つの主要なテーブルで構成されています。

### ER 図 (簡易)

```
[prefectures] 1--*< [sites] 1--*< [goshuin_records]
```

### テーブルスキーマ

#### `prefectures`

都道府県のマスターデータ。

| カラム名 | データ型    | 説明                    |
| -------- | ----------- | ----------------------- |
| `id`     | INTEGER     | 主キー                  |
| `name`   | VARCHAR(50) | 都道府県名 (例: 東京都) |

#### `sites`

寺社の基本情報。

| カラム名 | データ型 | 説明 |
| --- | --- | --- |
| `id` | INTEGER | 主キー |
| `name` | VARCHAR(255) | 寺社名 |
| `type` | ENUM('temple', 'shrine') | 種類 (寺 or 神社) |
| `prefecture_id` | INTEGER | `prefectures`テーブルへの外部キー |
| `address` | VARCHAR(255) | 住所 |
| `lat` | DECIMAL(9,6) | 緯度 |
| `lng` | DECIMAL(9,6) | 経度 |
| `description` | TEXT | 説明 |
| `created_at` | DATETIME | 作成日時 |
| `updated_at` | DATETIME | 更新日時 |

#### `goshuin_records`

参拝して頂いた御朱印の記録。

| カラム名     | データ型     | 説明                           |
| ------------ | ------------ | ------------------------------ |
| `id`         | INTEGER      | 主キー                         |
| `site_id`    | INTEGER      | `sites`テーブルへの外部キー    |
| `image_path` | VARCHAR(255) | アップロードされた画像へのパス |
| `visit_date` | DATE         | 参拝日                         |
| `notes`      | TEXT         | メモ                           |
| `created_at` | DATETIME     | 作成日時                       |
| `updated_at` | DATETIME     | 更新日時                       |

## 今後の方針

- テストコードの追加
- 御朱印記録の編集・削除機能
- 寺社情報の編集機能
- ユーザー認証機能
- 全文検索機能

## 型生成ワークフロー

このリポジトリでは、SQLite スキーマから TypeScript の型定義を自動生成し、`types/generated-db.ts` を元に `types/db.ts` をソース・オブ・トゥルースとして扱います。

基本的な流れ:

- 生成: `npm run gen:types` を実行すると `types/generated-db.ts` が更新されます。
- 差分チェック: ローカルで `node scripts/check-generated-types.cjs` を実行すると、`types/generated-db.ts` と `types/db.ts` の差分を検出します。差分があると非ゼロで終了します。
- マージ (手動): 差分を取り込むには `node scripts/merge-db-types-ast.cjs` を使って `types/db.ts` を更新してください（実行前にバックアップが作成されます）。

CI 自動 PR:

- GitHub Actions により、`gen:types` 実行後に差分があった場合は自動でブランチを作成し PR を作成するワークフローを用意しています（`.github/workflows/update-generated-types-pr.yml`）。
- 自動 PR が作成されたら内容を確認し、レビューしてマージしてください。

ポリシーの推奨:

- 生成ファイルを編集しないでください。スキーマの変更はマイグレーションで行い、`npm run gen:types` を通じて型を更新してください。
- CI は生成型をソース・オブ・トゥルースとみなします。開発フローとしては、スキーマ変更 →`npm run gen:types`→ ローカルで確認 → コミット（または自動 PR で提案）→ マージ、を推奨します。

## デプロイと PM2（運用）

本番で Node アプリを常駐させる場合、PM2 を使った運用手順の例を示します。ローカルでの検証やシンプルなデプロイ手順として使えます。

1. PM2 をインストール（本番サーバーではグローバル推奨）:

```bash
# グローバル推奨
npm install -g pm2

# またはプロジェクト内にインストール済みなら npm スクリプト経由で利用可
npm install
```

2. ビルドして PM2 で起動:

```bash
npm run build
npm run start:pm2
```

3. pm2-logrotate モジュールを有効化（ログのローテーション）:

```bash
# モジュールをインストール
npm run pm2:install-logrotate

# 例: 最大サイズ 10M、保持 7 世代、圧縮を有効
npm run pm2:configure-logrotate
```

4. 自動起動の設定（サーバー再起動後も自動で pm2 を復帰させる）:

```bash
# 1度だけ実行（管理者権限が必要な場合あり）
pm2 startup

# 現在のプロセス一覧を保存
pm2 save
```

5. ログ確認・停止・再起動:

```bash
npm run pm2:logs      # ログを確認
npm run stop:pm2      # プロセスを停止
npm run restart:pm2   # 再起動
```

注意:

- 本番では `pm2` をグローバルにインストールし、`pm2 startup` → `pm2 save` を行うのが安全です。
- `ecosystem.config.js` で `out_file`/`error_file` を `./logs/` に設定済みです。`logs/` はリポジトリ内に存在します。

## スクリーンショットの差し替え方法

現在のスクリーンショットは `public/images/screenshot.png` に置かれています。新しいスクリーンショットに差し替える手順:

1.  新しい画像をプロジェクトの `public/images/` に置く（ファイル名は `screenshot.png` に上書きするか、README 内の参照を更新してください）。
2.  画像をコミットします。

```bash
cp /path/to/new_screenshot.png public/images/screenshot.png
git add public/images/screenshot.png
git commit -m "Update screenshot"
git push
```

注意: 画像サイズは適宜リサイズし、解像度やファイルサイズに注意してください（推奨: 1200x800 ピクセル、圧縮済み PNG/JPEG）。

## デプロイ時の注意点

以下は本番サーバーへデプロイする際に特に注意すべき点のまとめです。

- 環境変数: `PORT` や `NODE_ENV`、SQLite のファイルパス等を適切に設定してください。`ecosystem.config.js` の `env` を利用すると管理しやすいです。
- SQLite の配置とバックアップ: デフォルトの `db/goshuin.sqlite3` を使う場合、書き込み権限と定期バックアップを確保してください。バックアップは cron と `sqlite3` の `.backup` コマンド、またはファイルコピーで自動化してください。
- ファイルアップロードの権限: `public/uploads/` へ画像を保存する処理があるため、Web サーバー（pm2 実行ユーザー）が書き込みできることを確認してください。
- リバースプロキシと SSL: 本番では `nginx` や `traefik` などのリバースプロキシをフロントに置き、TLS 終端を行うことを推奨します。HTTP → HTTPS のリダイレクトや長期キャッシュ設定はリバースプロキシ側で行ってください。
- pm2 自動起動: サーバー再起動時にアプリを自動的に復帰させるには、`pm2 startup` を実行し、表示されるコマンドを管理者権限で実行した後に `pm2 save` を実行してください。
- ログローテーション: リポジトリで `pm2-logrotate` を導入できますが、環境によっては OS の logrotate を使う方が好ましい場合があります。ログの保管先、世代数、圧縮設定は運用ポリシーに合わせて設定してください。
- セキュリティ: アップロードされた画像は外部からアクセス可能になるため、アップロード時の検証（ファイルタイプ、サイズ制限、ファイル名のサニタイズ）を強化してください。また、必要であれば認証・アクセス制御を実装してください。
- プロセス監視: pm2 のほかにホストの監視（例: systemd / monit / Datadog）やヘルスチェックを導入すると可用性が向上します。

上記を README に追記しました。その他追記したい運用手順やポリシーがあれば指示ください。
