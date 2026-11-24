import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applySchema } from "./schema";

declare global {
  var __bongkarDb: DatabaseSync | undefined;
}

export function getDataDir(): string {
  const dir = process.env.BONGKAR_DATA_DIR
    ? path.resolve(process.env.BONGKAR_DATA_DIR)
    : path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getUploadsDir(): string {
  const dir = path.join(getDataDir(), "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getDbPath(): string {
  if (process.env.BONGKAR_DB_PATH) {
    return path.resolve(process.env.BONGKAR_DB_PATH);
  }
  return path.join(getDataDir(), "bongkar-danantara.db");
}

export function getDb(): DatabaseSync {
  if (!global.__bongkarDb) {
    const dbPath = getDbPath();
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const db = new DatabaseSync(dbPath);
    applySchema(db);
    global.__bongkarDb = db;
  }
  return global.__bongkarDb;
}

export function closeDb(): void {
  if (global.__bongkarDb) {
    global.__bongkarDb.close();
    global.__bongkarDb = undefined;
  }
}
