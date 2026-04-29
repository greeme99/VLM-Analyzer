import { getFirestore } from "./_core/firebase";
import * as admin from "firebase-admin";
import type { InsertUser, InsertProject, InsertMotionEvent, InsertCorrection, InsertReport } from "../drizzle/schema";

/**
 * Firestore Database Helpers
 * Provides CRUD operations for VLM MODAPTS Motion Analyzer
 * Mirrors MySQL schema structure for easy migration
 */

/**
 * Users Collection
 */
export async function firestoreUpsertUser(user: InsertUser): Promise<void> {
  const db = await getFirestore();
  
  if (!user.openId) {
    throw new Error("User openId is required");
  }

  const userRef = db.collection("users").doc(user.openId);
  
  await userRef.set(
    {
      openId: user.openId,
      name: user.name || null,
      email: user.email || null,
      loginMethod: user.loginMethod || null,
      role: user.role || "user",
      lastSignedIn: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: (await userRef.get()).exists
        ? (await userRef.get()).data()?.createdAt
        : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function firestoreGetUserByOpenId(openId: string): Promise<any | undefined> {
  const db = await getFirestore();
  const doc = await db.collection("users").doc(openId).get();
  return doc.exists ? doc.data() : undefined;
}

/**
 * Projects Collection
 */
export async function firestoreCreateProject(data: InsertProject): Promise<any> {
  const db = await getFirestore();
  
  const projectRef = db.collection("projects").doc();
  
  await projectRef.set({
    id: projectRef.id,
    userId: data.userId,
    title: data.title,
    description: data.description || null,
    videoUrl: data.videoUrl || null,
    videoKey: data.videoKey || null,
    videoDuration: data.videoDuration || 0,
    status: data.status || "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: projectRef.id, ...data };
}

export async function firestoreGetProjectById(projectId: string): Promise<any | undefined> {
  const db = await getFirestore();
  const doc = await db.collection("projects").doc(projectId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : undefined;
}

export async function firestoreGetUserProjects(userId: string): Promise<any[]> {
  const db = await getFirestore();
  const snapshot = await db
    .collection("projects")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function firestoreUpdateProjectStatus(
  projectId: string,
  status: string,
  metadata?: Record<string, any>
): Promise<void> {
  const db = await getFirestore();
  
  await db.collection("projects").doc(projectId).update({
    status,
    ...metadata,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function firestoreDeleteProject(projectId: string): Promise<void> {
  const db = await getFirestore();
  
  // Delete project
  await db.collection("projects").doc(projectId).delete();
  
  // Delete related motion events
  const eventsSnapshot = await db
    .collection("motionEvents")
    .where("projectId", "==", projectId)
    .get();

  const batch = db.batch();
  eventsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

/**
 * Motion Events Collection
 */
export async function firestoreCreateMotionEvent(data: InsertMotionEvent): Promise<any> {
  const db = await getFirestore();
  
  const eventRef = db.collection("motionEvents").doc();
  
  await eventRef.set({
    id: eventRef.id,
    projectId: data.projectId,
    sequenceNumber: data.sequenceNumber,
    startTime: data.startTime,
    endTime: data.endTime,
    modaptsCode: data.modaptsCode,
    modValue: data.modValue,
    timeSeconds: data.timeSeconds,
    description: data.description || null,
    confidence: data.confidence || null,
    bodyPart: data.bodyPart || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: eventRef.id, ...data };
}

export async function firestoreGetProjectMotionEvents(projectId: string): Promise<any[]> {
  const db = await getFirestore();
  const snapshot = await db
    .collection("motionEvents")
    .where("projectId", "==", projectId)
    .orderBy("sequenceNumber", "asc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function firestoreUpdateMotionEvent(
  eventId: string,
  data: Partial<InsertMotionEvent>
): Promise<void> {
  const db = await getFirestore();
  
  await db.collection("motionEvents").doc(eventId).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Corrections Collection
 */
export async function firestoreCreateCorrection(data: InsertCorrection): Promise<any> {
  const db = await getFirestore();
  
  const correctionRef = db.collection("corrections").doc();
  
  await correctionRef.set({
    id: correctionRef.id,
    projectId: data.projectId,
    eventId: data.eventId,
    userId: data.userId,
    originalCode: data.originalCode,
    newCode: data.newCode,
    reason: data.reason || null,
    comment: data.comment || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: correctionRef.id, ...data };
}

export async function firestoreGetProjectCorrections(projectId: string): Promise<any[]> {
  const db = await getFirestore();
  const snapshot = await db
    .collection("corrections")
    .where("projectId", "==", projectId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Reports Collection
 */
export async function firestoreCreateReport(data: InsertReport): Promise<any> {
  const db = await getFirestore();
  
  const reportRef = db.collection("reports").doc();
  
  await reportRef.set({
    id: reportRef.id,
    projectId: data.projectId,
    reportType: data.reportType,
    reportUrl: data.reportUrl,
    reportKey: data.reportKey,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: reportRef.id, ...data };
}

export async function firestoreGetProjectReports(projectId: string): Promise<any[]> {
  const db = await getFirestore();
  const snapshot = await db
    .collection("reports")
    .where("projectId", "==", projectId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Batch Operations for Migration
 */
export async function firestoreBatchMigrateProjects(projects: any[]): Promise<void> {
  const db = await getFirestore();
  const batch = db.batch();

  projects.forEach((project) => {
    const docRef = db.collection("projects").doc(String(project.id));
    batch.set(docRef, {
      ...project,
      createdAt: project.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function firestoreBatchMigrateMotionEvents(events: any[]): Promise<void> {
  const db = await getFirestore();
  const batch = db.batch();

  events.forEach((event) => {
    const docRef = db.collection("motionEvents").doc(String(event.id));
    batch.set(docRef, {
      ...event,
      createdAt: event.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

export default {
  // Users
  firestoreUpsertUser,
  firestoreGetUserByOpenId,
  // Projects
  firestoreCreateProject,
  firestoreGetProjectById,
  firestoreGetUserProjects,
  firestoreUpdateProjectStatus,
  firestoreDeleteProject,
  // Motion Events
  firestoreCreateMotionEvent,
  firestoreGetProjectMotionEvents,
  firestoreUpdateMotionEvent,
  // Corrections
  firestoreCreateCorrection,
  firestoreGetProjectCorrections,
  // Reports
  firestoreCreateReport,
  firestoreGetProjectReports,
  // Batch Operations
  firestoreBatchMigrateProjects,
  firestoreBatchMigrateMotionEvents,
};
