import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertProject, projects, InsertMotionEvent, motionEvents, InsertCorrection, corrections, InsertReport, reports, Project } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Project queries
 */
export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  // Get the inserted project ID
  const insertedProject = await db.select().from(projects)
    .where(eq(projects.userId, data.userId))
    .orderBy(desc(projects.id))
    .limit(1);
  return insertedProject[0] || { id: 0 };
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function updateProjectStatus(projectId: number, status: Project["status"], data?: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (data) Object.assign(updateData, data);
  return await db.update(projects).set(updateData).where(eq(projects.id, projectId));
}

/**
 * Motion Event queries
 */
export async function createMotionEvent(data: InsertMotionEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(motionEvents).values(data);
}

export async function getProjectMotionEvents(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(motionEvents).where(eq(motionEvents.projectId, projectId)).orderBy(asc(motionEvents.sequenceNumber));
}

export async function updateMotionEvent(eventId: number, data: Partial<InsertMotionEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(motionEvents).set({ ...data, updatedAt: new Date() }).where(eq(motionEvents.id, eventId));
}

/**
 * Correction queries
 */
export async function createCorrection(data: InsertCorrection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(corrections).values(data);
}

export async function getProjectCorrections(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(corrections).where(eq(corrections.projectId, projectId)).orderBy(desc(corrections.createdAt));
}

/**
 * Report queries
 */
export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(reports).values(data);
}

export async function getProjectReports(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reports).where(eq(reports.projectId, projectId)).orderBy(desc(reports.generatedAt));
}
