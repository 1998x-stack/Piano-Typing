import type { SavedComposition, ScaleId } from "../../domain/types";
import { COMPOSITIONS_KEY, MAX_COMPOSITIONS, isComposition, readCompositions, saveComposition } from "./repository";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const DATABASE_NAME = "piano-typing";
const OBJECT_STORE = "compositions";
const DB_VERSION = 2;
const MAX_IMPORT_BYTES = 1_000_000;
const SCALE_IDS: ScaleId[] = ["major-pentatonic", "minor-pentatonic", "major", "natural-minor", "blues", "custom"];

function storageOrNull(): StorageLike | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; }
  catch { return null; }
}

export function normalizeComposition(value: unknown): SavedComposition | null {
  if (!isComposition(value)) return null;
  const record = value as SavedComposition;
  if (record.schemaVersion !== undefined && record.schemaVersion !== 2) return null;
  if (record.id.length < 1 || record.id.length > 120 || record.title.length < 1
    || record.title.length > 100 || !Number.isFinite(Date.parse(record.createdAt))) return null;
  return {
    schemaVersion: 2,
    id: record.id,
    title: record.title,
    createdAt: record.createdAt,
    durationMs: record.durationMs,
    preset: record.preset,
    notes: record.notes.map((note) => ({
      id: note.id, code: note.code, midi: note.midi,
      atMs: note.atMs, durationMs: note.durationMs,
      ...(typeof note.velocity === "number" && Number.isFinite(note.velocity)
        ? { velocity: Math.min(1, Math.max(0, note.velocity)) } : {})
    })),
    mappingMode: record.mappingMode === "character" ? "character" : "physical",
    scaleId: SCALE_IDS.includes(record.scaleId as ScaleId) ? record.scaleId : "major-pentatonic",
    rootMidi: Number.isInteger(record.rootMidi) && record.rootMidi! >= 48 && record.rootMidi! <= 72
      ? record.rootMidi : 60,
    customScale: Array.isArray(record.customScale) && record.customScale.length >= 2
      && record.customScale.length <= 12 && record.customScale[0] === 0
      && record.customScale.every((x,i) => Number.isInteger(x)
        && x >= 0 && x <= 11 && (i === 0 || x > record.customScale![i - 1]))
        ? [...record.customScale] : [0,2,4,7,9]
  };
}

export function exportCompositionJson(composition: SavedComposition): string {
  const clean = normalizeComposition(composition);
  if (!clean) throw new Error("Invalid composition");
  return JSON.stringify({ format: "PianoTypingComposition", schemaVersion: 2, composition: clean }, null, 2);
}

export function importCompositionJson(source: string): SavedComposition {
  if (new TextEncoder().encode(source).length > MAX_IMPORT_BYTES) throw new Error("Composition file is too large.");
  let value: unknown;
  try { value = JSON.parse(source) as unknown; }
  catch { throw new Error("Invalid JSON."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid composition file.");
  const envelope = value as Record<string, unknown>;
  if (envelope.format !== "PianoTypingComposition" || envelope.schemaVersion !== 2) {
    throw new Error("Unsupported composition format.");
  }
  const composition = normalizeComposition(envelope.composition);
  if (!composition) throw new Error("Composition validation failed.");
  return composition;
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OBJECT_STORE)) {
        db.createObjectStore(OBJECT_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable."));
    request.onblocked = () => reject(new Error("IndexedDB is blocked by another tab."));
  });
}

function transactionFinished(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Storage transaction aborted."));
    transaction.onerror = () => reject(transaction.error ?? new Error("Storage transaction failed."));
  });
}

function loadAll(db: IDBDatabase): Promise<SavedComposition[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(OBJECT_STORE, "readonly").objectStore(OBJECT_STORE).getAll();
    request.onsuccess = () => resolve((request.result as unknown[])
      .map(normalizeComposition).filter((item): item is SavedComposition => item !== null));
    request.onerror = () => reject(request.error ?? new Error("Unable to read saved compositions."));
  });
}

function newestFirst(items: SavedComposition[]): SavedComposition[] {
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .slice(0, MAX_COMPOSITIONS);
}

export class CompositionStore {
  private databasePromise: Promise<IDBDatabase | null> | null = null;
  private migrated: Promise<void> | null = null;

  constructor(
    private readonly storage: StorageLike | null = storageOrNull(),
    private readonly factory: IDBFactory | undefined = typeof indexedDB === "undefined" ? undefined : indexedDB
  ) {}

  private database(): Promise<IDBDatabase | null> {
    if (!this.databasePromise) {
      this.databasePromise = this.factory
        ? openDatabase(this.factory).catch(() => null)
        : Promise.resolve(null);
    }
    return this.databasePromise;
  }

  private async migrate(): Promise<void> {
    if (this.migrated) return this.migrated;
    this.migrated = this.doMigration().catch(() => {
      // Keep the legacy data intact if migration could not commit.
      this.migrated = null;
    });
    return this.migrated;
  }

  private async doMigration(): Promise<void> {
    const db = await this.database();
    if (!db || !this.storage) return;
    const legacy = readCompositions(this.storage).map(normalizeComposition)
      .filter((item): item is SavedComposition => item !== null);
    if (!legacy.length) return;
    const transaction = db.transaction(OBJECT_STORE, "readwrite");
    const finished = transactionFinished(transaction);
    const store = transaction.objectStore(OBJECT_STORE);
    for (const item of legacy) store.put(item);
    await finished;
    // Delete only after the transaction commits successfully.
    try { this.storage.removeItem(COMPOSITIONS_KEY); } catch { /* migration is still safe and idempotent */ }
  }

  async list(): Promise<SavedComposition[]> {
    await this.migrate();
    const db = await this.database();
    if (db) {
      try { return newestFirst(await loadAll(db)); }
      catch { /* retain a recoverable localStorage fallback */ }
    }
    return this.storage ? readCompositions(this.storage).map(normalizeComposition)
      .filter((item): item is SavedComposition => item !== null) : [];
  }

  async save(record: SavedComposition): Promise<boolean> {
    const composition = normalizeComposition(record);
    if (!composition) return false;
    await this.migrate();
    const db = await this.database();
    if (db) {
      try {
        const tx = db.transaction(OBJECT_STORE, "readwrite");
        const finished = transactionFinished(tx);
        const store = tx.objectStore(OBJECT_STORE);
        store.put(composition);
        const request = store.getAll();
        request.onsuccess = () => {
          const all = request.result as SavedComposition[];
          if (all.length <= MAX_COMPOSITIONS) return;
          const keepIds = new Set(newestFirst(all).map((item) => item.id));
          for (const item of all) if (!keepIds.has(item.id)) store.delete(item.id);
        };
        await finished;
        return true;
      } catch { return false; }
    }
    return this.storage ? saveComposition(composition, this.storage) : false;
  }

  async rename(id: string, nextTitle: string): Promise<boolean> {
    const title = nextTitle.trim();
    if (title.length === 0 || title.length > 100) return false;
    const existing = (await this.list()).find((item) => item.id === id);
    if (!existing) return false;
    return this.save({ ...existing, title });
  }

  async delete(id: string): Promise<boolean> {
    await this.migrate();
    const db = await this.database();
    if (db) {
      try {
        const tx = db.transaction(OBJECT_STORE, "readwrite");
        const finished = transactionFinished(tx);
        tx.objectStore(OBJECT_STORE).delete(id);
        await finished;
        return true;
      } catch { return false; }
    }
    if (!this.storage) return false;
    try {
      const remaining = readCompositions(this.storage).filter((item) => item.id !== id).reverse();
      this.storage.setItem(COMPOSITIONS_KEY, JSON.stringify(remaining));
      return true;
    } catch { return false; }
  }

  async clear(): Promise<boolean> {
    const db = await this.database();
    if (db) {
      try {
        const tx = db.transaction(OBJECT_STORE, "readwrite");
        const finished = transactionFinished(tx);
        tx.objectStore(OBJECT_STORE).clear();
        await finished;
      } catch { return false; }
    }
    if (this.storage) {
      try { this.storage.removeItem(COMPOSITIONS_KEY); } catch { return false; }
    }
    return true;
  }
}
