
const DB_NAME = 'aura_samples_db';
const DB_VERSION = 1;
const STORE_FILES = 'files';

export interface StoredFile {
    path: string;
    blob: Blob;
    lastModified: number;
}

// We use the global 'idb' loaded via CDN
declare const idb: any;

export class PersistenceManager {
    private db: any = null;

    async initDB() {
        if (!idb) {
            console.error("IndexedDB library (idb) not found!");
            return;
        }

        this.db = await idb.openDB(DB_NAME, DB_VERSION, {
            upgrade(db: any) {
                if (!db.objectStoreNames.contains(STORE_FILES)) {
                    db.createObjectStore(STORE_FILES, { keyPath: 'path' });
                }
            },
        });
        console.log("[PersistenceManager] DB Initialized");
    }

    async saveFile(path: string, file: File) {
        if (!this.db) await this.initDB();

        // Store minimal data to save space, but we need the blob
        const record: StoredFile = {
            path,
            blob: file, // File inherits from Blob, structured cloning works
            lastModified: file.lastModified
        };

        await this.db.put(STORE_FILES, record);
    }

    async saveFiles(files: FileList) {
        if (!this.db) await this.initDB();

        const tx = this.db.transaction(STORE_FILES, 'readwrite');
        const store = tx.objectStore(STORE_FILES);

        const promises = [];
        Array.from(files).forEach(file => {
            if (file.name.match(/\.(wav|mp3|ogg)$/i)) {
                const record: StoredFile = {
                    path: file.webkitRelativePath || file.name,
                    blob: file,
                    lastModified: file.lastModified
                };
                promises.push(store.put(record));
            }
        });

        await Promise.all(promises);
        await tx.done;
        console.log(`[PersistenceManager] Saved ${promises.length} files`);
    }

    async getAllFiles(): Promise<StoredFile[]> {
        if (!this.db) await this.initDB();
        return await this.db.getAll(STORE_FILES);
    }

    async clearLibrary() {
        if (!this.db) await this.initDB();
        await this.db.clear(STORE_FILES);
        console.log("[PersistenceManager] Library Cleared");
    }
}

export const persistenceManager = new PersistenceManager();
