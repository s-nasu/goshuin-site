// knex config (ESM)
const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db/goshuin.sqlite3'
    },
    useNullAsDefault: true, // sqliteで必要なおまじない
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  }
};

export default config;
