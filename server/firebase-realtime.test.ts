import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  initializeAnalysisProgress,
  updateAnalysisProgress,
  getAnalysisProgress,
  updateFrameProgress,
  markAnalysisComplete,
  markAnalysisFailed,
} from "./_core/firebase-realtime";

/**
 * Firebase Realtime Database Tests
 * Tests real-time progress tracking functionality
 */

describe("Firebase Realtime Database", () => {
  const testProjectId = "test-project-" + Date.now();
  const testUserId = "test-user-123";

  it("should initialize analysis progress", async () => {
    await initializeAnalysisProgress(testProjectId, testUserId, 4);
    const progress = await getAnalysisProgress(testProjectId);

    expect(progress).toBeDefined();
    expect(progress?.projectId).toBe(testProjectId);
    expect(progress?.userId).toBe(testUserId);
    expect(progress?.status).toBe("pending");
    expect(progress?.percentage).toBe(0);
    expect(progress?.currentStep).toBe(0);
    expect(progress?.totalSteps).toBe(4);
  });

  it("should update analysis progress", async () => {
    await updateAnalysisProgress(testProjectId, {
      status: "preparing",
      currentStep: 1,
      percentage: 25,
      message: "비디오 준비 중...",
    });

    const progress = await getAnalysisProgress(testProjectId);

    expect(progress?.status).toBe("preparing");
    expect(progress?.currentStep).toBe(1);
    expect(progress?.percentage).toBe(25);
    expect(progress?.message).toBe("비디오 준비 중...");
  });

  it("should update frame progress", async () => {
    await updateFrameProgress(testProjectId, 50, 100, 10);
    const progress = await getAnalysisProgress(testProjectId);

    expect(progress?.framesProcessed).toBe(50);
    expect(progress?.totalFrames).toBe(100);
    expect(progress?.currentFrameRate).toBe(10);
    expect(progress?.percentage).toBe(50);
  });

  it("should mark analysis as complete", async () => {
    const testResult = {
      frames: [
        {
          timestamp: 0,
          description: "Test motion",
          modaptsCode: "M3",
          confidence: 95,
        },
      ],
      totalDuration: 10,
      summary: "Test analysis complete",
    };

    await markAnalysisComplete(testProjectId, testResult);
    const progress = await getAnalysisProgress(testProjectId);

    expect(progress?.status).toBe("completed");
    expect(progress?.percentage).toBe(100);
    expect(progress?.message).toBe("분석 완료!");
  });

  it("should mark analysis as failed", async () => {
    const failProjectId = "fail-project-" + Date.now();
    await initializeAnalysisProgress(failProjectId, testUserId, 4);
    await markAnalysisFailed(failProjectId, "Test error message");

    const progress = await getAnalysisProgress(failProjectId);

    expect(progress?.status).toBe("failed");
    expect(progress?.message).toBe("분석 실패");
    expect(progress?.errorMessage).toBe("Test error message");
  });

  it("should track progress updates with timestamps", async () => {
    const trackProjectId = "track-project-" + Date.now();
    await initializeAnalysisProgress(trackProjectId, testUserId, 3);

    const progress1 = await getAnalysisProgress(trackProjectId);
    const timestamp1 = progress1?.updatedAt || 0;

    await new Promise((resolve) => setTimeout(resolve, 100));

    await updateAnalysisProgress(trackProjectId, {
      percentage: 50,
    });

    const progress2 = await getAnalysisProgress(trackProjectId);
    const timestamp2 = progress2?.updatedAt || 0;

    expect(timestamp2).toBeGreaterThan(timestamp1);
  });

  it("should calculate estimated remaining time", async () => {
    const timeProjectId = "time-project-" + Date.now();
    await initializeAnalysisProgress(timeProjectId, testUserId, 4);

    await updateFrameProgress(timeProjectId, 25, 100, 10);
    const progress = await getAnalysisProgress(timeProjectId);

    expect(progress?.estimatedRemainingTime).toBeDefined();
    expect(progress?.estimatedRemainingTime).toBeGreaterThan(0);
  });

  it("should handle concurrent progress updates", async () => {
    const concurrentProjectId = "concurrent-project-" + Date.now();
    await initializeAnalysisProgress(concurrentProjectId, testUserId, 4);

    const updates = Array.from({ length: 5 }, (_, i) => ({
      percentage: (i + 1) * 20,
      currentStep: i + 1,
    }));

    await Promise.all(
      updates.map((update) => updateAnalysisProgress(concurrentProjectId, update))
    );

    const progress = await getAnalysisProgress(concurrentProjectId);
    expect(progress?.percentage).toBe(100);
    expect(progress?.currentStep).toBe(5);
  });

  it("should validate progress data structure", async () => {
    const validateProjectId = "validate-project-" + Date.now();
    await initializeAnalysisProgress(validateProjectId, testUserId, 4);

    const progress = await getAnalysisProgress(validateProjectId);

    expect(progress).toHaveProperty("projectId");
    expect(progress).toHaveProperty("userId");
    expect(progress).toHaveProperty("status");
    expect(progress).toHaveProperty("currentStep");
    expect(progress).toHaveProperty("totalSteps");
    expect(progress).toHaveProperty("percentage");
    expect(progress).toHaveProperty("message");
    expect(progress).toHaveProperty("startedAt");
    expect(progress).toHaveProperty("updatedAt");
  });

  it("should handle missing project gracefully", async () => {
    const nonExistentProjectId = "non-existent-" + Date.now();
    const progress = await getAnalysisProgress(nonExistentProjectId);

    expect(progress).toBeNull();
  });
});
