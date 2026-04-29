import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { generateHtmlReport, generateCsvReport, generateExcelReport } from "./report_generator";
import type { MotionEventData, ProjectReportData } from "./report_generator";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { projects, motionEvents } from "../drizzle/schema";

export const reportDownloadRouter = router({
  /**
   * Generate and download HTML report
   */
  downloadHtml: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Fetch project data
        const projectData = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!projectData || projectData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        const project = projectData[0];

        // Fetch motion events
        const motionEventsData = await db
          .select()
          .from(motionEvents)
          .where(eq(motionEvents.projectId, input.projectId));

        // Transform motion events to report format
        const reportMotionEvents: MotionEventData[] = motionEventsData.map((event) => ({
          sequence: event.sequenceNumber,
          code: event.modaptsCode,
          modValue: event.modValue,
          timeSeconds: parseFloat(event.timeSeconds),
          description: event.description || "",
          bodyPart: event.bodyPart || "Unknown",
          confidence: parseInt(event.confidence || "0"),
        }));

        // Calculate totals
        const totalMods = reportMotionEvents.reduce((sum, e) => sum + e.modValue, 0);
        const totalTimeSeconds = reportMotionEvents.reduce((sum, e) => sum + e.timeSeconds, 0);

        const reportData: ProjectReportData = {
          projectId: input.projectId,
          projectName: project.title,
          createdAt: project.createdAt,
          totalEvents: reportMotionEvents.length,
          totalMods,
          totalTimeSeconds,
          motionEvents: reportMotionEvents,
        };

        const htmlContent = generateHtmlReport(reportData);

        return {
          format: "html",
          content: htmlContent,
          filename: `report-${input.projectId}-${Date.now()}.html`,
          mimeType: "text/html",
        };
      } catch (error) {
        console.error("Error generating HTML report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate HTML report",
        });
      }
    }),

  /**
   * Generate and download CSV report
   */
  downloadCsv: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Fetch project data
        const projectData = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!projectData || projectData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        const project = projectData[0];

        // Fetch motion events
        const motionEventsData = await db
          .select()
          .from(motionEvents)
          .where(eq(motionEvents.projectId, input.projectId));

        // Transform motion events to report format
        const reportMotionEvents: MotionEventData[] = motionEventsData.map((event) => ({
          sequence: event.sequenceNumber,
          code: event.modaptsCode,
          modValue: event.modValue,
          timeSeconds: parseFloat(event.timeSeconds),
          description: event.description || "",
          bodyPart: event.bodyPart || "Unknown",
          confidence: parseInt(event.confidence || "0"),
        }));

        // Calculate totals
        const totalMods = reportMotionEvents.reduce((sum, e) => sum + e.modValue, 0);
        const totalTimeSeconds = reportMotionEvents.reduce((sum, e) => sum + e.timeSeconds, 0);

        const reportData: ProjectReportData = {
          projectId: input.projectId,
          projectName: project.title,
          createdAt: project.createdAt,
          totalEvents: reportMotionEvents.length,
          totalMods,
          totalTimeSeconds,
          motionEvents: reportMotionEvents,
        };

        const csvContent = generateCsvReport(reportData);

        return {
          format: "csv",
          content: csvContent,
          filename: `report-${input.projectId}-${Date.now()}.csv`,
          mimeType: "text/csv",
        };
      } catch (error) {
        console.error("Error generating CSV report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate CSV report",
        });
      }
    }),

  /**
   * Generate and download Excel report
   */
  downloadExcel: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Fetch project data
        const projectData = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!projectData || projectData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        const project = projectData[0];

        // Fetch motion events
        const motionEventsData = await db
          .select()
          .from(motionEvents)
          .where(eq(motionEvents.projectId, input.projectId));

        // Transform motion events to report format
        const reportMotionEvents: MotionEventData[] = motionEventsData.map((event) => ({
          sequence: event.sequenceNumber,
          code: event.modaptsCode,
          modValue: event.modValue,
          timeSeconds: parseFloat(event.timeSeconds),
          description: event.description || "",
          bodyPart: event.bodyPart || "Unknown",
          confidence: parseInt(event.confidence || "0"),
        }));

        // Calculate totals
        const totalMods = reportMotionEvents.reduce((sum, e) => sum + e.modValue, 0);
        const totalTimeSeconds = reportMotionEvents.reduce((sum, e) => sum + e.timeSeconds, 0);

        const reportData: ProjectReportData = {
          projectId: input.projectId,
          projectName: project.title,
          createdAt: project.createdAt,
          totalEvents: reportMotionEvents.length,
          totalMods,
          totalTimeSeconds,
          motionEvents: reportMotionEvents,
        };

        const excelBuffer = generateExcelReport(reportData);

        return {
          format: "xlsx",
          content: excelBuffer.toString("base64"),
          filename: `report-${input.projectId}-${Date.now()}.xlsx`,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      } catch (error) {
        console.error("Error generating Excel report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate Excel report",
        });
      }
    }),

  /**
   * Get report download status
   */
  getStatus: protectedProcedure
    .input(z.object({ projectId: z.number(), format: z.enum(["html", "csv", "xlsx"]) }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Check if project exists
        const projectData = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!projectData || projectData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        return {
          projectId: input.projectId,
          format: input.format,
          status: "ready",
          message: "Report is ready for download",
        };
      } catch (error) {
        console.error("Error checking report status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check report status",
        });
      }
    }),
});
