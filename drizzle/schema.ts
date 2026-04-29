import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Analysis Project: 분석 프로젝트 메타데이터
 * 사용자가 업로드한 영상과 분석 결과를 관리
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(), // S3 storage URL
  videoKey: text("videoKey").notNull(), // S3 storage key (for reference)
  videoDuration: int("videoDuration").notNull(), // seconds
  status: mysqlEnum("status", ["pending", "analyzing", "completed", "failed"]).default("pending").notNull(),
  analysisResult: text("analysisResult"), // JSON string of analysis results
  standardTime: varchar("standardTime", { length: 20 }), // in seconds (stored as string for precision)
  totalMods: int("totalMods"), // total MOD count
  errorMessage: text("errorMessage"), // error details if failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Motion Event: 분석된 개별 동작 이벤트
 * 각 프로젝트의 MODAPTS 코드 및 시간 정보
 */
export const motionEvents = mysqlTable("motionEvents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  sequenceNumber: int("sequenceNumber").notNull(), // 동작 순서
  startTime: varchar("startTime", { length: 20 }).notNull(), // seconds (stored as string for precision)
  endTime: varchar("endTime", { length: 20 }).notNull(), // seconds (stored as string for precision)
  modaptsCode: varchar("modaptsCode", { length: 10 }).notNull(), // e.g., "M3", "G1", "P0"
  modValue: int("modValue").notNull(), // MOD count
  timeSeconds: varchar("timeSeconds", { length: 20 }).notNull(), // calculated seconds (stored as string for precision)
  description: text("description"), // VLM-generated description
  bodyPart: varchar("bodyPart", { length: 50 }), // e.g., "hand", "arm", "leg"
  confidence: varchar("confidence", { length: 10 }), // 0-100 confidence score (stored as string)
  isManuallyAdjusted: boolean("isManuallyAdjusted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MotionEvent = typeof motionEvents.$inferSelect;
export type InsertMotionEvent = typeof motionEvents.$inferInsert;

/**
 * Correction History: 사용자 보정 이력
 * 분석 결과에 대한 수정 사항 추적
 */
export const corrections = mysqlTable("corrections", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  eventId: int("eventId").notNull().references(() => motionEvents.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  originalCode: varchar("originalCode", { length: 10 }).notNull(),
  newCode: varchar("newCode", { length: 10 }).notNull(),
  reason: text("reason"), // 수정 사유
  comment: text("comment"), // 추가 코멘트
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Correction = typeof corrections.$inferSelect;
export type InsertCorrection = typeof corrections.$inferInsert;

/**
 * Analysis Report: 생성된 보고서 저장
 * PDF/Excel 보고서 URL 및 메타데이터
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  reportType: mysqlEnum("reportType", ["pdf", "excel"]).notNull(),
  reportUrl: text("reportUrl").notNull(), // S3 storage URL
  reportKey: text("reportKey").notNull(), // S3 storage key
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;