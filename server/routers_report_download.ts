import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { generateHtmlReport, generateCsvReport, generateExcelReport } from "./report_generator";
import type { MotionEventData, ProjectReportData } from "./report_generator";

export const reportDownloadRouter = router({
  /**
   * Generate and download HTML report
   */
  downloadHtml: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Fetch project and motion events from database
        // For now, return placeholder data
        const mockData: ProjectReportData = {
          projectId: input.projectId,
          projectName: `프로젝트 #${input.projectId}`,
          createdAt: new Date(),
          totalEvents: 0,
          totalMods: 0,
          totalTimeSeconds: 0,
          motionEvents: [],
        };

        const htmlContent = generateHtmlReport(mockData);

        return {
          format: "html",
          content: htmlContent,
          filename: `report-${input.projectId}.html`,
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
        // TODO: Fetch project and motion events from database
        const mockData: ProjectReportData = {
          projectId: input.projectId,
          projectName: `프로젝트 #${input.projectId}`,
          createdAt: new Date(),
          totalEvents: 0,
          totalMods: 0,
          totalTimeSeconds: 0,
          motionEvents: [],
        };

        const csvContent = generateCsvReport(mockData);

        return {
          format: "csv",
          content: csvContent,
          filename: `report-${input.projectId}.csv`,
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
        // TODO: Fetch project and motion events from database
        const mockData: ProjectReportData = {
          projectId: input.projectId,
          projectName: `프로젝트 #${input.projectId}`,
          createdAt: new Date(),
          totalEvents: 0,
          totalMods: 0,
          totalTimeSeconds: 0,
          motionEvents: [],
        };

        const excelBuffer = generateExcelReport(mockData);

        return {
          format: "xlsx",
          content: excelBuffer.toString("base64"),
          filename: `report-${input.projectId}.xlsx`,
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
      return {
        projectId: input.projectId,
        format: input.format,
        status: "ready",
        message: "Report is ready for download",
      };
    }),
});
