// Database SQLite (modulo node:sqlite, incluso in Node 22). Nessuna dipendenza esterna.
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs'), path = require('path');

function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY,
      user TEXT NOT NULL UNIQUE COLLATE NOCASE,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      created INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS characters (
      account_id INTEGER PRIMARY KEY REFERENCES accounts(id),
      rev INTEGER NOT NULL,
      lv INTEGER NOT NULL,
      data TEXT NOT NULL,
      updated INTEGER NOT NULL
    );
  `);
  return db;
}
module.exports = { openDb };
