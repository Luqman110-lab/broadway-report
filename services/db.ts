
import { Student, Teacher, MarkRecord, SchoolSettings } from "../types";

const DB_NAME = 'BroadwayDB';
const DB_VERSION = 5; // Bumped to ensure schema consistency

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = (event.target as IDBOpenDBRequest).transaction;
      
      if (!db.objectStoreNames.contains('students')) {
        const store = db.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
        store.createIndex('classLevel', 'classLevel', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('teachers')) {
        db.createObjectStore('teachers', { keyPath: 'id', autoIncrement: true });
      }
      
      let marksStore;
      if (!db.objectStoreNames.contains('marks')) {
        marksStore = db.createObjectStore('marks', { keyPath: 'id', autoIncrement: true });
      } else {
        marksStore = tx?.objectStore('marks');
      }

      // Ensure index exists regardless of when store was created
      if (marksStore && !marksStore.indexNames.contains('studentId')) {
           marksStore.createIndex('studentId', 'studentId', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };
  });
};

// Generic CRUD Helpers
const getAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const add = async <T>(storeName: string, item: T): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

const update = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const remove = async (storeName: string, id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Specific API
export const dbService = {
  getStudents: () => getAll<Student>('students'),
  addStudent: (s: Student) => add('students', s),
  updateStudent: (s: Student) => update('students', s),
  
  // Cascading delete for student
  deleteStudent: async (id: number | string) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['students', 'marks'], 'readwrite');
        const studentStore = tx.objectStore('students');
        const marksStore = tx.objectStore('marks');
        
        // Handle potential ID type mismatch (String vs Number keys)
        // This handles cases where data imported via JSON/CSV might have string IDs
        // while the database expects numbers, or vice versa.
        const numericId = Number(id);
        const stringId = String(id);

        // 1. Delete Student Record (attempt both types to be safe)
        studentStore.delete(numericId);
        studentStore.delete(stringId);

        // 2. Delete associated marks using index cursor
        if (marksStore.indexNames.contains('studentId')) {
            const index = marksStore.index('studentId');
            
            // Helper to delete marks for a specific ID key
            const deleteMarksForKey = (key: number | string) => {
                try {
                    const request = index.openCursor(IDBKeyRange.only(key));
                    request.onsuccess = (event) => {
                        const cursor = (event.target as IDBRequest).result;
                        if (cursor) {
                            cursor.delete();
                            cursor.continue();
                        }
                    };
                } catch (e) {
                    // Ignore errors if the key type doesn't match the index content
                }
            };

            deleteMarksForKey(numericId);
            deleteMarksForKey(stringId);
            
        } else {
            console.warn("Index 'studentId' missing on marks store. Associated marks may not be deleted.");
        }

        tx.oncomplete = () => resolve();
        tx.onerror = (e) => {
            console.error("Transaction failed", (e.target as IDBRequest).error);
            reject((e.target as IDBRequest).error);
        };
    });
  },
  
  getTeachers: () => getAll<Teacher>('teachers'),
  addTeacher: (t: Teacher) => add('teachers', t),
  updateTeacher: (t: Teacher) => update('teachers', t),
  deleteTeacher: (id: number) => remove('teachers', id),
  
  getMarks: () => getAll<MarkRecord>('marks'),
  saveMark: async (m: MarkRecord) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('marks', 'readwrite');
      const store = tx.objectStore('marks');
      
      // Ensure index exists before using
      if (store.indexNames.contains('studentId')) {
          const index = store.index('studentId');
          const req = index.getAll(IDBKeyRange.only(m.studentId));
          
          req.onsuccess = () => {
            const existing = req.result.find(
              r => r.term === m.term && r.year === m.year && r.type === m.type
            );
            
            if (existing) {
              m.id = existing.id;
              store.put(m);
            } else {
              store.add(m);
            }
          };
      } else {
          // Fallback if index missing (shouldn't happen with DB_VERSION 4)
          store.add(m);
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // Settings API
  getSettings: async (): Promise<SchoolSettings> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const req = store.get('config');
        req.onsuccess = () => {
            if (req.result) {
                resolve(req.result);
            } else {
                // Default Settings
                resolve({
                    id: 'config',
                    schoolName: 'BROADWAY NURSERY AND PRIMARY SCHOOL',
                    addressBox: 'P.O.BOX 10, NAAMA-MITYANA',
                    contactPhones: '0772324288  0709087676  0744073812',
                    motto: 'WE BUILD FOR THE FUTURE',
                    regNumber: 'ME/P/10247',
                    centreNumber: '670135',
                    currentTerm: 1,
                    currentYear: new Date().getFullYear(),
                    nextTermBeginBoarders: '',
                    nextTermBeginDay: ''
                });
            }
        };
        req.onerror = () => reject(req.error);
    });
  },
  saveSettings: (s: SchoolSettings) => update('settings', { ...s, id: 'config' }),

  // Data Management API (Backup/Restore)
  exportData: async () => {
    const students = await getAll('students');
    const teachers = await getAll('teachers');
    const marks = await getAll('marks');
    const settings = await getAll('settings');

    const data = {
        version: DB_VERSION,
        timestamp: new Date().toISOString(),
        students,
        teachers,
        marks,
        settings
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Broadway_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: async (jsonContent: string) => {
    try {
        const data = JSON.parse(jsonContent);
        const db = await openDB();
        const tx = db.transaction(['students', 'teachers', 'marks', 'settings'], 'readwrite');

        // Clear existing
        tx.objectStore('students').clear();
        tx.objectStore('teachers').clear();
        tx.objectStore('marks').clear();
        tx.objectStore('settings').clear();

        // Import new
        if (data.students) data.students.forEach((i: any) => tx.objectStore('students').add(i));
        if (data.teachers) data.teachers.forEach((i: any) => tx.objectStore('teachers').add(i));
        if (data.marks) data.marks.forEach((i: any) => tx.objectStore('marks').add(i));
        if (data.settings) data.settings.forEach((i: any) => tx.objectStore('settings').add(i));

        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        throw new Error("Invalid backup file format");
    }
  }
};
