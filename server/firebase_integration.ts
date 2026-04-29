/**
 * Firebase/Firestore Integration Module
 * Provides database abstraction layer for Firestore
 */

import * as admin from "firebase-admin";
import { getFirestore, Firestore, Query, DocumentData } from "firebase-admin/firestore";

let db: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 * Requires FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL env vars
 */
export function initializeFirebase() {
  if (db) return db;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn(
        "[Firebase] Missing credentials. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL"
      );
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });

    db = getFirestore();
    console.log("[Firebase] Initialized successfully");
    return db;
  } catch (error) {
    console.error("[Firebase] Initialization failed:", error);
    return null;
  }
}

/**
 * Get Firestore instance
 */
export function getDb(): Firestore | null {
  if (!db) {
    return initializeFirebase();
  }
  return db;
}

/**
 * Create a new document in a collection
 */
export async function createDocument(
  collection: string,
  data: DocumentData
): Promise<string | null> {
  const firestore = getDb();
  if (!firestore) return null;

  try {
    const docRef = await firestore.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Firestore] Created document in ${collection}: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`[Firestore] Error creating document in ${collection}:`, error);
    throw error;
  }
}

/**
 * Get a document by ID
 */
export async function getDocument(collection: string, docId: string): Promise<DocumentData | null> {
  const firestore = getDb();
  if (!firestore) return null;

  try {
    const doc = await firestore.collection(collection).doc(docId).get();

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error(`[Firestore] Error getting document from ${collection}:`, error);
    throw error;
  }
}

/**
 * Update a document
 */
export async function updateDocument(
  collection: string,
  docId: string,
  data: DocumentData
): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    await firestore.collection(collection).doc(docId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Firestore] Updated document in ${collection}: ${docId}`);
    return true;
  } catch (error) {
    console.error(`[Firestore] Error updating document in ${collection}:`, error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(collection: string, docId: string): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    await firestore.collection(collection).doc(docId).delete();

    console.log(`[Firestore] Deleted document from ${collection}: ${docId}`);
    return true;
  } catch (error) {
    console.error(`[Firestore] Error deleting document from ${collection}:`, error);
    throw error;
  }
}

/**
 * Query documents with filters
 */
export async function queryDocuments(
  collection: string,
  filters?: Array<{ field: string; operator: string; value: any }>
): Promise<DocumentData[]> {
  const firestore = getDb();
  if (!firestore) return [];

  try {
    let query: Query = firestore.collection(collection);

    if (filters) {
      for (const filter of filters) {
        query = query.where(filter.field, filter.operator as any, filter.value);
      }
    }

    const snapshot = await query.get();
    const documents: DocumentData[] = [];

    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return documents;
  } catch (error) {
    console.error(`[Firestore] Error querying documents from ${collection}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a collection
 */
export async function getAllDocuments(collection: string): Promise<DocumentData[]> {
  const firestore = getDb();
  if (!firestore) return [];

  try {
    const snapshot = await firestore.collection(collection).get();
    const documents: DocumentData[] = [];

    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return documents;
  } catch (error) {
    console.error(`[Firestore] Error getting all documents from ${collection}:`, error);
    throw error;
  }
}

/**
 * Batch write operations
 */
export async function batchWrite(
  operations: Array<{
    type: "set" | "update" | "delete";
    collection: string;
    docId: string;
    data?: DocumentData;
  }>
): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    const batch = firestore.batch();

    for (const op of operations) {
      const docRef = firestore.collection(op.collection).doc(op.docId);

      switch (op.type) {
        case "set":
          batch.set(docRef, {
            ...op.data,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          break;
        case "update":
          batch.update(docRef, {
            ...op.data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          break;
        case "delete":
          batch.delete(docRef);
          break;
      }
    }

    await batch.commit();
    console.log(`[Firestore] Batch write completed: ${operations.length} operations`);
    return true;
  } catch (error) {
    console.error("[Firestore] Error in batch write:", error);
    throw error;
  }
}

/**
 * Migrate data from MySQL to Firestore
 * This is a helper function for initial data migration
 */
export async function migrateData(
  sourceData: Array<{ collection: string; documents: DocumentData[] }>
): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    for (const source of sourceData) {
      const batch = firestore.batch();
      let count = 0;

      for (const doc of source.documents) {
        const docRef = firestore.collection(source.collection).doc();
        batch.set(docRef, {
          ...doc,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;

        // Firestore batch has a 500 operation limit
        if (count % 500 === 0) {
          await batch.commit();
          console.log(`[Firestore] Migrated ${count} documents to ${source.collection}`);
        }
      }

      if (count % 500 !== 0) {
        await batch.commit();
        console.log(`[Firestore] Migrated ${count} documents to ${source.collection}`);
      }
    }

    return true;
  } catch (error) {
    console.error("[Firestore] Error during migration:", error);
    throw error;
  }
}
