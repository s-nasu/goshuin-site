import express, { Request, Response } from 'express';
import path from 'path';
import db from './database.js';
import type { Prefectures, Sites, GoshuinRecords } from './types/db.js';
import multer from 'multer';
declare global {
  // PM2 / cluster 二重起動防止用フラグ
  // eslint-disable-next-line no-var
  var __APP_LISTENING__ : boolean | undefined;
}

const app = express();
const port = 3000;

// --- 設定 ---
// 画面表示(view)にEJSを使う設定
app.set('view engine', 'ejs');
// viewファイルの置き場所を 'views' フォルダに設定

// CSSや画像などの静的ファイルを 'public' フォルダから提供する設定
// ビルド後も元のプロジェクトのviews/publicを参照する
app.set('views', path.join(process.cwd(), 'views'));

app.use(express.static(path.join(process.cwd(), 'public')));

// POSTされたフォームデータを解析するための設定
app.use(express.urlencoded({ extended: true }));


// --- ルーティング (URLごとの処理) ---
// トップページ ('/')
app.get('/', (req, res) => {
  // views/index.ejs ファイルを描画して表示する
  res.render('index', { title: '御朱印めぐり' });
});

// 寺社登録フォームページを表示するルート (GET /sites/new)
app.get('/sites/new', async (req, res) => {
  try {
    // DBから都道府県リストを取得してフォームに渡す
  const prefectures = await db<Prefectures>('prefectures').select('id', 'name').orderBy('id');
    // フォームを描画
    res.render('sites/new', { title: '新しい寺社を登録', prefectures: prefectures, site: {} });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生しました');
  }
});

// フォームから送信されたデータを受け取りDBに保存するルート (POST /sites)
app.post('/sites', async (req, res) => {
  try {
    const { name, type, prefecture_id, address, lat, lng, description } = req.body;

    // DBに新しい寺社を挿入
  const [newSite] = await db<Sites>('sites').insert({
      name,
      type,
      prefecture_id,
      address,
      lat: lat || null, // 空の場合はnull
      lng: lng || null, // 空の場合はnull
      description
    }).returning('*');

    // 成功したら、作成した詳細ページにリダイレクト
    if (!newSite || typeof newSite.id === 'undefined') {
      // 挿入後に予期せぬ結果が返された場合は一覧に戻す
      return res.redirect('/sites');
    }
    res.redirect(`/sites/${newSite.id}`);

  } catch (err) {
    console.error(err);
    res.status(500).send('登録中にエラーが発生しました');
  }
});

// 寺社一覧ページ
app.get('/sites', async (req, res) => {
  try {
  const sites = await db<Sites>('sites')
      .join('prefectures', 'sites.prefecture_id', 'prefectures.id')
      .select('sites.id', 'sites.name', 'sites.type', 'prefectures.name as prefecture_name');

    res.render('sites/index', { title: '寺社一覧', sites });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生しました');
  }
});

// 寺社詳細ページ
app.get('/sites/:id', async (req, res) => {
  try {
  const site = await db<Sites>('sites')
      .join('prefectures', 'sites.prefecture_id', 'prefectures.id')
      .select('sites.*', 'prefectures.name as prefecture_name')
      .where('sites.id', req.params.id)
      .first(); // .first() は結果を単一のオブジェクトとして返す

    if (!site) {
      return res.status(404).send('寺社が見つかりません');
    }

  const goshuin_records = await db<GoshuinRecords>('goshuin_records')
      .where('site_id', req.params.id)
      .orderBy('visit_date', 'desc');

    res.render('sites/show', { title: site.name, site, goshuin_records });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生しました');
  }
});

// 地図ページ
app.get('/map', async (req, res) => {
  try {
  const sitesWithCoords = await db<Sites>('sites')
      .whereNotNull('lat')
      .whereNotNull('lng')
      .select('id', 'name', 'lat', 'lng');

    res.render('map', { title: '地図から探す', sites: sitesWithCoords });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生しました');
  }
});

// 都道府県一覧ページ
app.get('/prefectures', async (req, res) => {
  try {
  const prefectures = await db<Prefectures>('prefectures').select('id', 'name').orderBy('id');
    res.render('prefectures/index', { title: '都道府県から探す', prefectures });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生しました');
  }
});

// 特定の都道府県に属する寺社一覧ページ
app.get('/prefectures/:id/sites', async (req, res) => {
  try {
  const prefecture = await db<Prefectures>('prefectures').where('id', req.params.id).first();
    if (!prefecture) {
      return res.status(404).send('都道府県が見つかりません');
    }
  const sites = await db<Sites>('sites')
      .where('prefecture_id', req.params.id)
      .select('id', 'name', 'type');

    res.render('prefectures/show', { title: `${prefecture.name}の寺社一覧`, prefecture, sites });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生しました');
  }
});


// --- Multer 設定 (ファイルアップロード用) ---
const storage = multer.diskStorage({
  // ファイルの保存先を指定
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  // ファイル名を指定 (重複しないように)
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// 御朱印登録処理のルート
app.post('/sites/:id/goshuin', upload.single('image'), async (req, res) => {
  try {
    const site_id = req.params.id;
    const { visit_date, notes } = req.body;

    // ファイルがアップロードされていない場合はエラー
    if (!req.file) {
      return res.status(400).send('画像ファイルが選択されていません。');
    }
    const image_path = req.file.filename;

    await db('goshuin_records').insert({
      site_id,
      visit_date,
      notes,
      image_path
    });

    res.redirect(`/sites/${site_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('御朱印の登録中にエラーが発生しました');
  }
});


// --- サーバーの起動 ---
// このファイルが直接実行された場合のみ、サーバーを起動する
// PM2 / cluster / ESM でも確実に起動させるための判定:
// 1) 環境変数 FORCE_LISTEN が指定されていれば常に listen
// 2) NODE_ENV === 'development' なら dev 用に listen
// 3) それ以外は既にサーバーが開始されていない (簡易フラグ) 場合のみ listen
// process.env.pm_id が存在する場合 (PM2) でも各ワーカーで listen させる
const shouldListen = process.env.FORCE_LISTEN === '1' ||
  process.env.NODE_ENV === 'development' ||
  !globalThis.__APP_LISTENING__;

if (shouldListen) {
  if (!(globalThis as any).__APP_LISTENING__) {
    (globalThis as any).__APP_LISTENING__ = true;
    app.listen(port, () => {
      console.log(`サーバーが http://localhost:${port} で起動しました`);
    });
  }
}

// テストのためにappをエクスポート
export default app;
