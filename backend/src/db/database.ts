import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../../data/students.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    studentId TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    className TEXT NOT NULL,
    birthday TEXT,
    guardian TEXT,
    notes TEXT,
    status TEXT NOT NULL,
    isActive INTEGER NOT NULL,
    dataHash TEXT NOT NULL,
    studentIdHash TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    updatedBy TEXT NOT NULL,
    lastFeeTxHash TEXT,
    lastFeeAmountWei TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS blockchain_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventName TEXT NOT NULL,
    transactionHash TEXT NOT NULL,
    blockNumber INTEGER NOT NULL,
    logIndex INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    studentIdHash TEXT,
    dataHash TEXT,
    actor TEXT,
    account TEXT,
    grantedBy TEXT,
    revokedBy TEXT,
    UNIQUE(transactionHash, logIndex)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_events_block ON blockchain_events(blockNumber DESC)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_events_tx ON blockchain_events(transactionHash)
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS wallet_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    balance TEXT NOT NULL,
    previousBalance TEXT,
    changeAmount TEXT,
    changeType TEXT NOT NULL,
    transactionHash TEXT,
    timestamp TEXT NOT NULL,
    description TEXT
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_balances_address ON wallet_balances(address, timestamp DESC)
`);

export default db;
