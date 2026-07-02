import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('money.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      color TEXT,
      icon TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_default INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id TEXT REFERENCES categories(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      to_account_id TEXT REFERENCES accounts(id),
      note TEXT,
      date TEXT NOT NULL,
      receipt_image TEXT,
      is_recurring INTEGER DEFAULT 0,
      recurring_id TEXT,
      debt_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      interest_rate REAL DEFAULT 0,
      monthly_payment REAL NOT NULL,
      start_date TEXT NOT NULL,
      paid_installments INTEGER DEFAULT 0,
      due_day INTEGER NOT NULL,
      account_id TEXT REFERENCES accounts(id),
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id),
      amount REAL NOT NULL,
      month TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id TEXT REFERENCES categories(id),
      account_id TEXT REFERENCES accounts(id),
      frequency TEXT DEFAULT 'monthly',
      day_of_month INTEGER,
      start_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
    CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
  `);
}

export async function wipeDatabase(): Promise<void> {
  const database = getDb();
  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM budgets;
    DELETE FROM recurring_transactions;
    DELETE FROM debts;
    DELETE FROM accounts;
    DELETE FROM categories;
    DELETE FROM settings;
  `);
}
