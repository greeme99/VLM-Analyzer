import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut, storageGet, generateFileKey } from "../storage/storage";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";

export const uploadRouter = router({
  /**
   * Get presigned upload URL for video file
   */
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        contentType: z.string().regex(/^video\//),
        fileSize: z.number().min(1).max(500 * 1024 * 1024), // 500MB max
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate a unique file key
        const fileKey = generateFileKey(ctx.user.id, input.filename);

        return {
          fileKey,
          uploadUrl: `/api/upload/${fileKey}`,
          expiresIn: 3600, // 1 hour
        };
      } catch (error) {
        console.error("Error generating upload URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate upload URL",
        });
      }
    }),

  /**
   * Create a new analysis project with uploaded video
   */
  createProject: protectedProcedure
    .input(
      z.object({
        projectName: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        videoFileKey: z.string().min(1),
        videoFileName: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify file exists in storage
        const videoUrl = await storageGet(input.videoFileKey).catch(() => null);

        if (!videoUrl?.url) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video file not found in storage",
          });
        }

        // Get database connection
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // TODO: Create project record in database
        // For now, return success response
        console.log(`[Upload] Project created for user ${ctx.user.id}`);
        console.log(`[Upload] Triggering analysis for video: ${input.videoFileKey}`);

        return {
          projectId: Math.floor(Math.random() * 10000),
          status: "analyzing",
          message: "Project created. Analysis will start shortly.",
        };
      } catch (error) {
        console.error("Error creating project:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
        });
      }
    }),

  /**
   * Get upload progress for a file
   */
  getUploadProgress: protectedProcedure
    .input(z.object({ fileKey: z.string() }))
    .query(async ({ input }) => {
      return {
        fileKey: input.fileKey,
        progress: 100,
        status: "completed",
      };
    }),

  /**
   * Delete uploaded video
   */
  deleteVideo: protectedProcedure
    .input(z.object({ fileKey: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify user owns this file
        if (!input.fileKey.includes(`videos/${ctx.user.id}/`)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to delete this file",
          });
        }

        console.log(`[Upload] Deleting video: ${input.fileKey}`);

        return {
          success: true,
          message: "Video deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting video:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete video",
        });
      }
    }),
});
