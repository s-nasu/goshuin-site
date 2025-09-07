const knex = require('knex');
const config = require('./knexfile.js');

// 開発環境用のデータベース接続を初期化
const db = knex(config.development);

// 他ファイルで使えるようにエクスポート
module.exports = db;
