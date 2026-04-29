import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

/**
 * Motion Analysis Router
 * Handles video analysis using Gemini 2.5 Flash API
 */
export const analysisRouter = router({
  /**
   * Start video analysis with Gemini 2.5 Flash
   * Analyzes video frames and generates MODAPTS codes
   */
  startAnalysis: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      videoUrl: z.string(),
      analysisPrompt: z.string().min(1, "Analysis prompt is required"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify project ownership
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        // Update project status to "analyzing"
        await db.updateProjectStatus(input.projectId, "analyzing");

        // Prepare analysis prompt for Gemini
        const systemPrompt = `You are an expert in MODAPTS (Modular Arrangement of Predetermined Time Standards) motion analysis.
Analyze the provided video frames and identify the work motions.

For each motion detected, provide:
1. Time range (e.g., "0:00-0:05")
2. Motion description (what action is being performed)
3. MODAPTS code (M1-M6 for move, G0-G3 for get, P0-P2 for place, D3, L1, E2, F3, R2)
4. MOD value (time units: M1=1, M2=2, M3=3, M4=4, M5=5, M6=6, G0=0, G1=1, G2=2, G3=3, P0=0, P1=1, P2=2, D3=3, L1=1, E2=2, F3=3, R2=2)
5. Confidence score (0-1)

User's analysis goal: ${input.analysisPrompt}

Respond in JSON format:
{
  "motions": [
    {
      "timeRange": "0:00-0:05",
      "description": "Motion description",
      "code": "M2",
      "modValue": 2,
      "confidence": 0.95
    }
  ],
  "totalMOD": 10,
  "standardTime": "1.29s"
}`;

        // Call Gemini 2.5 Flash API
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this video and provide MODAPTS codes. Video URL: ${input.videoUrl}`,
                },
                {
                  type: "file_url",
                  file_url: {
                    url: input.videoUrl,
                    mime_type: "video/mp4",
                  },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "modapts_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  motions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        timeRange: { type: "string" },
                        description: { type: "string" },
                        code: { type: "string" },
                        modValue: { type: "number" },
                        confidence: { type: "number" },
                      },
                      required: ["timeRange", "description", "code", "modValue", "confidence"],
                    },
                  },
                  totalMOD: { type: "number" },
                  standardTime: { type: "string" },
                },
                required: ["motions", "totalMOD", "standardTime"],
                additionalProperties: false,
              },
            },
          },
        });

        // Parse Gemini response
        const analysisContent = response.choices?.[0]?.message?.content;
        if (!analysisContent) {
          throw new Error("No analysis response from Gemini");
        }

        // Handle both string and array responses
        let analysisText = typeof analysisContent === 'string' ? analysisContent : '';
        if (Array.isArray(analysisContent)) {
          analysisText = analysisContent.map((part: any) => part.text || '').join('');
        }

        const analysisResult = JSON.parse(analysisText);

        // Store motion events in database
        for (let i = 0; i < analysisResult.motions.length; i++) {
          const motion = analysisResult.motions[i];
          const [startTime, endTime] = motion.timeRange.split("-");
          
          await db.createMotionEvent({
            projectId: input.projectId,
            sequenceNumber: i + 1,
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            modaptsCode: motion.code,
            modValue: motion.modValue,
            timeSeconds: String((motion.modValue * 0.129).toFixed(2)),
            description: motion.description,
            confidence: String((motion.confidence * 100).toFixed(0)),
          });
        }

        // Update project with analysis results
        await db.updateProjectStatus(input.projectId, "completed", {
          analysisResult: JSON.stringify(analysisResult),
          totalMods: analysisResult.totalMOD,
          standardTime: analysisResult.standardTime,
        });

        return {
          success: true,
          projectId: input.projectId,
          analysis: analysisResult,
          motionCount: analysisResult.motions?.length || 0,
          totalMOD: analysisResult.totalMOD || 0,
          standardTime: analysisResult.standardTime || "0s",
        };
      } catch (error) {
        console.error("Error starting analysis:", error);
        
        // Update project status to failed
        try {
          await db.updateProjectStatus(input.projectId, "failed", {
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          });
        } catch (e) {
          console.error("Error updating project status:", e);
        }

        throw new Error(`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get motion events for a project
   */
  getMotions: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        const motions = await db.getProjectMotionEvents(input.projectId);
        return motions;
      } catch (error) {
        console.error("Error fetching motions:", error);
        return [];
      }
    }),

  /**
   * Update motion event (for manual correction)
   */
  updateMotion: protectedProcedure
    .input(z.object({
      motionId: z.number(),
      modaptsCode: z.string().optional(),
      modValue: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Update motion
        await db.updateMotionEvent(input.motionId, {
          modaptsCode: input.modaptsCode,
          modValue: input.modValue,
          description: input.description,
          isManuallyAdjusted: true,
        });

        return { success: true };
      } catch (error) {
        console.error("Error updating motion:", error);
        throw new Error("Failed to update motion");
      }
    }),
});
