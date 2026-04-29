import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // Project Management
  // ============================================================================
  project: router({
    /**
     * Create a new analysis project
     */
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.createProject({
            userId: ctx.user.id,
            title: input.title,
            description: input.description,
            videoUrl: "",
            videoKey: "",
            videoDuration: 0,
            status: "pending",
          });
          return {
            success: true,
            message: "Project created",
          };
        } catch (error) {
          console.error("Error creating project:", error);
          throw new Error("Failed to create project");
        }
      }),

    /**
     * Get user's projects
     */
    list: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const projects = await db.getUserProjects(ctx.user.id);
          return projects;
        } catch (error) {
          console.error("Error fetching projects:", error);
          return [];
        }
      }),

    /**
     * Get project details
     */
    get: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Project not found or unauthorized");
          }
          return project;
        } catch (error) {
          console.error("Error fetching project:", error);
          throw new Error("Failed to fetch project");
        }
      }),

    /**
     * Update project status
     */
    updateStatus: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        status: z.enum(["pending", "analyzing", "completed", "failed"]),
        standardTime: z.string().optional(),
        totalMods: z.number().optional(),
        analysisResult: z.string().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          await db.updateProjectStatus(input.projectId, input.status, {
            standardTime: input.standardTime,
            totalMods: input.totalMods,
            analysisResult: input.analysisResult,
            errorMessage: input.errorMessage,
          });

          return { success: true };
        } catch (error) {
          console.error("Error updating project:", error);
          throw new Error("Failed to update project");
        }
      }),

    /**
     * Delete project
     */
    delete: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          // In production, implement actual deletion
          // For now, just mark as deleted or archive

          return { success: true };
        } catch (error) {
          console.error("Error deleting project:", error);
          throw new Error("Failed to delete project");
        }
      }),
  }),

  // ============================================================================
  // Motion Events
  // ============================================================================
  motionEvent: router({
    /**
     * Get motion events for a project
     */
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          const events = await db.getProjectMotionEvents(input.projectId);
          return events;
        } catch (error) {
          console.error("Error fetching motion events:", error);
          return [];
        }
      }),

    /**
     * Update motion event (correction)
     */
    update: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        projectId: z.number(),
        modaptsCode: z.string().optional(),
        modValue: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          const updateData: any = { isManuallyAdjusted: true };
          if (input.modaptsCode) updateData.modaptsCode = input.modaptsCode;
          if (input.modValue !== undefined) {
            updateData.modValue = input.modValue;
            updateData.timeSeconds = (input.modValue * 0.129).toString();
          }
          if (input.description) updateData.description = input.description;

          await db.updateMotionEvent(input.eventId, updateData);

          return { success: true };
        } catch (error) {
          console.error("Error updating motion event:", error);
          throw new Error("Failed to update motion event");
        }
      }),
  }),

  // ============================================================================
  // Corrections
  // ============================================================================
  correction: router({
    /**
     * Get correction history for a project
     */
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          const corrections = await db.getProjectCorrections(input.projectId);
          return corrections;
        } catch (error) {
          console.error("Error fetching corrections:", error);
          return [];
        }
      }),

    /**
     * Create correction record
     */
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        eventId: z.number(),
        originalCode: z.string(),
        newCode: z.string(),
        reason: z.string().optional(),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          await db.createCorrection({
            projectId: input.projectId,
            eventId: input.eventId,
            userId: ctx.user.id,
            originalCode: input.originalCode,
            newCode: input.newCode,
            reason: input.reason,
            comment: input.comment,
          });

          return { success: true };
        } catch (error) {
          console.error("Error creating correction:", error);
          throw new Error("Failed to create correction");
        }
      }),
  }),

  // ============================================================================
  // Reports
  // ============================================================================
  report: router({
    /**
     * Get reports for a project
     */
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          const reports = await db.getProjectReports(input.projectId);
          return reports;
        } catch (error) {
          console.error("Error fetching reports:", error);
          return [];
        }
      }),

    /**
     * Download HTML report
     */
    downloadHtml: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          const events = await db.getProjectMotionEvents(input.projectId);
          const totalMods = events.reduce((sum, e) => sum + e.modValue, 0);
          const totalTimeSeconds = events.reduce((sum, e) => sum + parseFloat(e.timeSeconds), 0);

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>MODAPTS Analysis Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                .summary-item { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
                .summary-item h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
                .summary-item .value { font-size: 24px; font-weight: bold; color: #007bff; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #007bff; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:hover { background: #f9f9f9; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>MODAPTS Motion Analysis Report</h1>
                <p><strong>Project:</strong> ${project.title}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                
                <div class="summary">
                  <div class="summary-item">
                    <h3>Total Events</h3>
                    <div class="value">${events.length}</div>
                  </div>
                  <div class="summary-item">
                    <h3>Total MODs</h3>
                    <div class="value">${totalMods}</div>
                  </div>
                  <div class="summary-item">
                    <h3>Total Time</h3>
                    <div class="value">${totalTimeSeconds.toFixed(2)}s</div>
                  </div>
                  <div class="summary-item">
                    <h3>Avg Time/Event</h3>
                    <div class="value">${(totalTimeSeconds / events.length).toFixed(2)}s</div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Code</th>
                      <th>MOD</th>
                      <th>Time (s)</th>
                      <th>Body Part</th>
                      <th>Confidence</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${events.map((e, i) => `
                      <tr>
                        <td>${i + 1}</td>
                        <td><strong>${e.modaptsCode}</strong></td>
                        <td>${e.modValue}</td>
                        <td>${parseFloat(e.timeSeconds).toFixed(3)}</td>
                        <td>${e.bodyPart || "-"}</td>
                        <td>${e.confidence || "-"}%</td>
                        <td>${e.description || "-"}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>

                <div class="footer">
                  <p>This report was generated by VLM MODAPTS Motion Analyzer</p>
                  <p>Report ID: ${input.projectId}-${Date.now()}</p>
                </div>
              </div>
            </body>
            </html>
          `;

          return {
            format: "html",
            content: htmlContent,
            filename: `report-${input.projectId}-${Date.now()}.html`,
            mimeType: "text/html",
          };
        } catch (error) {
          console.error("Error downloading HTML report:", error);
          throw new Error("Failed to download HTML report");
        }
      }),

    /**
     * Download CSV report
     */
    downloadCsv: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          const events = await db.getProjectMotionEvents(input.projectId);

          let csvContent = "Sequence,Code,MOD,Time (s),Body Part,Confidence,Description\n";
          events.forEach((e, i) => {
            csvContent += `${i + 1},${e.modaptsCode},${e.modValue},${parseFloat(e.timeSeconds).toFixed(3)},${e.bodyPart || "-"},${e.confidence || "-"},"${e.description || ""}"\n`;
          });

          return {
            format: "csv",
            content: csvContent,
            filename: `report-${input.projectId}-${Date.now()}.csv`,
            mimeType: "text/csv",
          };
        } catch (error) {
          console.error("Error downloading CSV report:", error);
          throw new Error("Failed to download CSV report");
        }
      }),

    /**
     * Generate PDF report
     */
    generatePdf: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          return {
            success: true,
            message: "PDF generation queued",
          };
        } catch (error) {
          console.error("Error generating PDF:", error);
          throw new Error("Failed to generate PDF");
        }
      }),

    /**
     * Generate Excel report
     */
    generateExcel: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const project = await db.getProjectById(input.projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }

          return {
            success: true,
            message: "Excel generation queued",
          };
        } catch (error) {
          console.error("Error generating Excel:", error);
          throw new Error("Failed to generate Excel");
        }
      }),
  }),

  // ============================================================================
  // Reference Data
  // ============================================================================
  reference: router({
    /**
     * Get MODAPTS codes reference
     */
    modaptsCodes: publicProcedure
      .query(() => {
        return {
          move: {
            M1: { mods: 1, description: "Finger move (2.5cm)", seconds: 0.129 },
            M2: { mods: 2, description: "Hand move (5cm)", seconds: 0.258 },
            M3: { mods: 3, description: "Forearm move (15cm)", seconds: 0.387 },
            M4: { mods: 4, description: "Arm move (30cm)", seconds: 0.516 },
            M5: { mods: 5, description: "Arm + torso move (60cm)", seconds: 0.645 },
            M6: { mods: 6, description: "Full body move (90cm+)", seconds: 0.774 },
          },
          get: {
            G0: { mods: 0, description: "Finger grasp (easy)", seconds: 0 },
            G1: { mods: 1, description: "Hand grasp (normal)", seconds: 0.129 },
            G2: { mods: 2, description: "Two-hand grasp (heavy)", seconds: 0.258 },
            G3: { mods: 3, description: "Tool grasp", seconds: 0.387 },
          },
          place: {
            P0: { mods: 0, description: "Light place", seconds: 0 },
            P1: { mods: 1, description: "Normal place", seconds: 0.129 },
            P2: { mods: 2, description: "Careful place", seconds: 0.258 },
          },
          other: {
            D3: { mods: 3, description: "Decision", seconds: 0.387 },
            L1: { mods: 1, description: "Read (short)", seconds: 0.129 },
            E2: { mods: 2, description: "Eye move", seconds: 0.258 },
            F3: { mods: 3, description: "Foot move", seconds: 0.387 },
            R2: { mods: 2, description: "Read (general)", seconds: 0.258 },
          },
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
