import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    // 1. 都道府県マスターテーブル (prefectures)
    .createTable('prefectures', function(table: Knex.CreateTableBuilder) {
      table.increments('id').primary(); // 主キー
      table.string('name', 50).notNullable().unique(); // 都道府県名 (例: 東京都)
    })
    // 2. 寺社テーブル (sites) - 改訂版
  .createTable('sites', function (table: Knex.CreateTableBuilder) {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.enum('type', ['temple', 'shrine']).notNullable();

      // 外部キーとして都道府県IDを持つように変更
      table.integer('prefecture_id').unsigned().notNullable().references('id').inTable('prefectures');

      table.string('address', 255);    // 市区町村以下の住所
      table.decimal('lat', 9, 6);      // 緯度
      table.decimal('lng', 9, 6);      // 経度
      table.text('description');
      table.timestamps(true, true);
    })
    // 3. 御朱印記録テーブル (goshuin_records) - 変更なし
  .createTable('goshuin_records', function (table: Knex.CreateTableBuilder) {
      table.increments('id').primary();
      table.integer('site_id').unsigned().notNullable().references('id').inTable('sites').onDelete('CASCADE');
      table.string('image_path', 255).notNullable();
      table.date('visit_date').notNullable();
      table.text('notes');
      table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
  // upの逆の順番でテーブルを削除
  await knex.schema
    .dropTableIfExists('goshuin_records')
    .dropTableIfExists('sites')
    .dropTableIfExists('prefectures');
}
