import knex, { Knex } from 'knex';
import config from './knexfile.js';

// 開発環境用のデータベース接続を初期化
const db: Knex = knex(config.development);

// ESMエクスポート
export default db;
