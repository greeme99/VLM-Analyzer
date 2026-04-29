import * as admin from "firebase-admin";
import { ENV } from "./env";

/**
 * Firebase Admin SDK 초기화
 * Firestore, Storage, Authentication 통합 관리
 */

let _firebaseApp: admin.app.App | null = null;
let _firestore: admin.firestore.Firestore | null = null;
let _storage: admin.storage.Storage | null = null;
let _auth: admin.auth.Auth | null = null;

/**
 * Firebase Admin SDK 초기화
 */
export async function initializeFirebase(): Promise<admin.app.App> {
  if (_firebaseApp) {
    return _firebaseApp;
  }

  try {
    const serviceAccount = {
      projectId: ENV.firebaseProjectId,
      privateKeyId: ENV.firebasePrivateKeyId,
      privateKey: ENV.firebasePrivateKey?.replace(/\\n/g, "\n"),
      clientEmail: ENV.firebaseClientEmail,
      clientId: ENV.firebaseClientId,
      authUri: "https://accounts.google.com/o/oauth2/auth",
      tokenUri: "https://oauth2.googleapis.com/token",
      authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
      clientX509CertUrl: `https://www.googleapis.com/robot/v1/metadata/x509/${ENV.firebaseClientEmail}`,
    };

    _firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: ENV.firebaseStorageBucket,
      databaseURL: ENV.firebaseDatabaseUrl,
    });

    console.log("[Firebase] Admin SDK initialized successfully");
    return _firebaseApp;
  } catch (error) {
    console.error("[Firebase] Failed to initialize Admin SDK:", error);
    throw error;
  }
}

/**
 * Firestore 인스턴스 가져오기
 */
export async function getFirestore(): Promise<admin.firestore.Firestore> {
  if (!_firestore) {
    const app = await initializeFirebase();
    _firestore = admin.firestore(app);
    
    // Firestore 설정
    _firestore.settings({
      ignoreUndefinedProperties: true,
    });
  }
  return _firestore;
}

/**
 * Firebase Storage 인스턴스 가져오기
 */
export async function getStorage(): Promise<admin.storage.Storage> {
  if (!_storage) {
    const app = await initializeFirebase();
    _storage = admin.storage(app);
  }
  return _storage;
}

/**
 * Firebase Authentication 인스턴스 가져오기
 */
export async function getAuth(): Promise<admin.auth.Auth> {
  if (!_auth) {
    const app = await initializeFirebase();
    _auth = admin.auth(app);
  }
  return _auth;
}

/**
 * Firebase 연결 상태 확인
 */
export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    const firestore = await getFirestore();
    const testDoc = await firestore.collection("_health").doc("check").get();
    console.log("[Firebase] Connection check passed");
    return true;
  } catch (error) {
    console.error("[Firebase] Connection check failed:", error);
    return false;
  }
}

/**
 * Firestore 컬렉션 생성 (초기 설정용)
 */
export async function initializeFirestoreCollections(): Promise<void> {
  try {
    const firestore = await getFirestore();

    // 컬렉션 초기화 (빈 문서 생성)
    const collections = [
      "users",
      "projects",
      "motionEvents",
      "corrections",
      "reports",
    ];

    for (const collection of collections) {
      const ref = firestore.collection(collection);
      const snapshot = await ref.limit(1).get();

      if (snapshot.empty) {
        // 초기 문서 생성 (나중에 삭제 가능)
        await ref.doc("_init").set({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          initialized: true,
        });
        console.log(`[Firestore] Collection '${collection}' initialized`);
      }
    }
  } catch (error) {
    console.error("[Firestore] Failed to initialize collections:", error);
    throw error;
  }
}

export default {
  initializeFirebase,
  getFirestore,
  getStorage,
  getAuth,
  checkFirebaseConnection,
  initializeFirestoreCollections,
};
