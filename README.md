# 御朱印めぐり管理帳 (Goshuin Logbook)

全国の寺社でいただいた御朱印を記録・管理するためのウェブアプリケーションです。

![アプリのスクリーンショット](https://via.placeholder.com/600x400?text=Screenshot+Placeholder)
*(ここにアプリケーションのスクリーンショットを配置します。現在はプレースホルダー画像を表示しています。実際のスクリーンショットは後日追加予定です)*

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
    git clone https://github.com/s-nasu/goshuin-site.git
    cd goshuin-site
    ```

2.  **依存関係をインストール:**
    ```bash
    npm install
    ```

3.  **データベースのセットアップ:**
    以下のコマンドを実行して、テーブルを作成し、初期データ（都道府県マスタ）を投入します。
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

5.  **ブラウザでアクセス:**
    サーバーが起動したら、ウェブブラウザで `http://localhost:3000` を開いてください。


## データベース設計

このアプリケーションは3つの主要なテーブルで構成されています。

### ER図 (簡易)
```
[prefectures] 1--*< [sites] 1--*< [goshuin_records]
```

### テーブルスキーマ

#### `prefectures`
都道府県のマスターデータ。

| カラム名 | データ型 | 説明 |
|---|---|---|
| `id` | INTEGER | 主キー |
| `name` | VARCHAR(50) | 都道府県名 (例: 東京都) |

#### `sites`
寺社の基本情報。

| カラム名 | データ型 | 説明 |
|---|---|---|
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

| カラム名 | データ型 | 説明 |
|---|---|---|
| `id` | INTEGER | 主キー |
| `site_id` | INTEGER | `sites`テーブルへの外部キー |
| `image_path` | VARCHAR(255) | アップロードされた画像へのパス |
| `visit_date` | DATE | 参拝日 |
| `notes` | TEXT | メモ |
| `created_at` | DATETIME | 作成日時 |
| `updated_at` | DATETIME | 更新日時 |

## 今後の方針

- テストコードの追加
- 御朱印記録の編集・削除機能
- 寺社情報の編集機能
- ユーザー認証機能
- 全文検索機能
