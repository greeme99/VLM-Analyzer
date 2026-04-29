/**
 * Firebase/Firestore Database Helpers
 * Replaces MySQL database operations with Firestore
 */

import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  getAllDocuments,
} from "./firebase_integration";
import type { User, InsertUser } from "../drizzle/schema";

// Collection names
const COLLECTIONS = {
  USERS: "users",
  PROJECTS: "projects",
  MOTION_EVENTS: "motionEvents",
  CORRECTIONS: "corrections",
  REPORTS: "reports",
};

/**
 * User Operations
 */

export async function upsertUserFirebase(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  try {
    // Check if user exists
    const existingUsers = await queryDocuments(COLLECTIONS.USERS, [
      { field: "openId", operator: "==", value: user.openId },
    ]);

    if (existingUsers.length > 0) {
      // Update existing user
      await updateDocument(COLLECTIONS.USERS, existingUsers[0].id, {
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        lastSignedIn: new Date(),
      });
    } else {
      // Create new user
      await createDocument(COLLECTIONS.USERS, {
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        role: user.role || "user",
        lastSignedIn: new Date(),
      });
    }
  } catch (error) {
    console.error("[Firebase] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenIdFirebase(openId: string): Promise<any | undefined> {
  try {
    const users = await queryDocuments(COLLECTIONS.USERS, [
      { field: "openId", operator: "==", value: openId },
    ]);

    return users.length > 0 ? users[0] : undefined;
  } catch (error) {
    console.error("[Firebase] Failed to get user:", error);
    throw error;
  }
}

/**
 * Project Operations
 */

export async function createProjectFirebase(projectData: {
  title: string;
  description?: string;
  videoUrl: string;
  userId: string;
}): Promise<string | null> {
  try {
    const docId = await createDocument(COLLECTIONS.PROJECTS, {
      ...projectData,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docId;
  } catch (error) {
    console.error("[Firebase] Failed to create project:", error);
    throw error;
  }
}

export async function getProjectFirebase(projectId: string): Promise<any | null> {
  try {
    return await getDocument(COLLECTIONS.PROJECTS, projectId);
  } catch (error) {
    console.error("[Firebase] Failed to get project:", error);
    throw error;
  }
}

export async function updateProjectFirebase(
  projectId: string,
  updates: Record<string, any>
): Promise<boolean> {
  try {
    return await updateDocument(COLLECTIONS.PROJECTS, projectId, updates);
  } catch (error) {
    console.error("[Firebase] Failed to update project:", error);
    throw error;
  }
}

export async function deleteProjectFirebase(projectId: string): Promise<boolean> {
  try {
    return await deleteDocument(COLLECTIONS.PROJECTS, projectId);
  } catch (error) {
    console.error("[Firebase] Failed to delete project:", error);
    throw error;
  }
}

export async function getUserProjectsFirebase(userId: string): Promise<any[]> {
  try {
    return await queryDocuments(COLLECTIONS.PROJECTS, [
      { field: "userId", operator: "==", value: userId },
    ]);
  } catch (error) {
    console.error("[Firebase] Failed to get user projects:", error);
    throw error;
  }
}

/**
 * Motion Event Operations
 */

export async function createMotionEventFirebase(eventData: {
  projectId: string;
  code: string;
  modValue: number;
  timeSeconds: number;
  description?: string;
  bodyPart?: string;
  confidence: number;
}): Promise<string | null> {
  try {
    const docId = await createDocument(COLLECTIONS.MOTION_EVENTS, {
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docId;
  } catch (error) {
    console.error("[Firebase] Failed to create motion event:", error);
    throw error;
  }
}

export async function getProjectMotionEventsFirebase(projectId: string): Promise<any[]> {
  try {
    return await queryDocuments(COLLECTIONS.MOTION_EVENTS, [
      { field: "projectId", operator: "==", value: projectId },
    ]);
  } catch (error) {
    console.error("[Firebase] Failed to get motion events:", error);
    throw error;
  }
}

export async function updateMotionEventFirebase(
  eventId: string,
  updates: Record<string, any>
): Promise<boolean> {
  try {
    return await updateDocument(COLLECTIONS.MOTION_EVENTS, eventId, updates);
  } catch (error) {
    console.error("[Firebase] Failed to update motion event:", error);
    throw error;
  }
}

export async function deleteMotionEventFirebase(eventId: string): Promise<boolean> {
  try {
    return await deleteDocument(COLLECTIONS.MOTION_EVENTS, eventId);
  } catch (error) {
    console.error("[Firebase] Failed to delete motion event:", error);
    throw error;
  }
}

/**
 * Correction Operations
 */

export async function createCorrectionFirebase(correctionData: {
  projectId: string;
  eventId: string;
  originalCode: string;
  newCode: string;
  reason?: string;
  comment?: string;
}): Promise<string | null> {
  try {
    const docId = await createDocument(COLLECTIONS.CORRECTIONS, {
      ...correctionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docId;
  } catch (error) {
    console.error("[Firebase] Failed to create correction:", error);
    throw error;
  }
}

export async function getProjectCorrectionsFirebase(projectId: string): Promise<any[]> {
  try {
    return await queryDocuments(COLLECTIONS.CORRECTIONS, [
      { field: "projectId", operator: "==", value: projectId },
    ]);
  } catch (error) {
    console.error("[Firebase] Failed to get corrections:", error);
    throw error;
  }
}

/**
 * Report Operations
 */

export async function createReportFirebase(reportData: {
  projectId: string;
  format: "html" | "csv" | "xlsx";
  content: string;
  filename: string;
}): Promise<string | null> {
  try {
    const docId = await createDocument(COLLECTIONS.REPORTS, {
      ...reportData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docId;
  } catch (error) {
    console.error("[Firebase] Failed to create report:", error);
    throw error;
  }
}

export async function getProjectReportsFirebase(projectId: string): Promise<any[]> {
  try {
    return await queryDocuments(COLLECTIONS.REPORTS, [
      { field: "projectId", operator: "==", value: projectId },
    ]);
  } catch (error) {
    console.error("[Firebase] Failed to get reports:", error);
    throw error;
  }
}
