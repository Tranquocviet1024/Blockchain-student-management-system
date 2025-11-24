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

export default db;
