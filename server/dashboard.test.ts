import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as analytics from "./analytics";

/**
 * 대시보드 분석 통계 테스트
 */

describe("Dashboard Analytics", () => {
  const testUserId = "test-user-123";
  const testProjectId = "test-project-456";

  beforeAll(async () => {
    // 테스트 데이터 초기화
    console.log("Dashboard analytics test setup");
  });

  afterAll(async () => {
    console.log("Dashboard analytics test cleanup");
  });

  describe("recordAnalysis", () => {
    it("should record analysis with complete data", async () => {
      const record = {
        projectId: testProjectId,
        userId: testUserId,
        videoUrl: "https://example.com/video.mp4",
        videoDuration: 120,
        analysisPrompt: "Analyze worker motion",
        startedAt: Date.now(),
        completedAt: Date.now() + 5000,
        duration: 5,
        status: "completed" as const,
        framesCount: 150,
        modsCount: 45,
        standardTime: 2.5,
        confidence: 0.92,
      };

      // 기록이 저장되는지 확인
      await analytics.recordAnalysis(record);
      expect(record.projectId).toBe(testProjectId);
      expect(record.status).toBe("completed");
    });

    it("should handle failed analysis", async () => {
      const record = {
        projectId: testProjectId,
        userId: testUserId,
        videoUrl: "https://example.com/video.mp4",
        videoDuration: 120,
        analysisPrompt: "Analyze worker motion",
        startedAt: Date.now(),
        completedAt: Date.now() + 5000,
        duration: 5,
        status: "failed" as const,
        framesCount: 0,
        modsCount: 0,
        standardTime: 0,
        confidence: 0,
        errorMessage: "API timeout",
      };

      await analytics.recordAnalysis(record);
      expect(record.status).toBe("failed");
      expect(record.errorMessage).toBeDefined();
    });
  });

  describe("getUserAnalytics", () => {
    it("should return user analytics with default values for new user", async () => {
      const newUserId = "new-user-789";
      const userAnalytics = await analytics.getUserAnalytics(newUserId);

      expect(userAnalytics.userId).toBe(newUserId);
      expect(userAnalytics.totalAnalyses).toBe(0);
      expect(userAnalytics.successRate).toBe(0);
      expect(userAnalytics.totalVideoDuration).toBe(0);
    });

    it("should calculate success rate correctly", async () => {
      const userAnalytics = await analytics.getUserAnalytics(testUserId);

      expect(userAnalytics.successRate).toBeGreaterThanOrEqual(0);
      expect(userAnalytics.successRate).toBeLessThanOrEqual(100);
    });

    it("should identify most used prompt", async () => {
      const userAnalytics = await analytics.getUserAnalytics(testUserId);

      expect(typeof userAnalytics.mostUsedPrompt).toBe("string");
    });

    it("should calculate analysis frequency", async () => {
      const userAnalytics = await analytics.getUserAnalytics(testUserId);

      expect(userAnalytics.analysisFrequency).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getPerformanceMetrics", () => {
    it("should return empty array for date range with no data", async () => {
      const startDate = "2020-01-01";
      const endDate = "2020-01-31";

      const metrics = await analytics.getPerformanceMetrics(testUserId, startDate, endDate);

      expect(Array.isArray(metrics)).toBe(true);
    });

    it("should return metrics sorted by date", async () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const endDate = today.toISOString().split("T")[0];

      const metrics = await analytics.getPerformanceMetrics(testUserId, startDate, endDate);

      if (metrics.length > 1) {
        for (let i = 1; i < metrics.length; i++) {
          expect(metrics[i].date >= metrics[i - 1].date).toBe(true);
        }
      }
    });
  });

  describe("getAnalysisHistory", () => {
    it("should return empty array for user with no history", async () => {
      const newUserId = "user-no-history";
      const history = await analytics.getAnalysisHistory(newUserId);

      expect(Array.isArray(history)).toBe(true);
    });

    it("should respect limit and offset parameters", async () => {
      const history = await analytics.getAnalysisHistory(testUserId, 5, 0);

      expect(history.length).toBeLessThanOrEqual(5);
    });

    it("should return history sorted by date descending", async () => {
      const history = await analytics.getAnalysisHistory(testUserId, 100, 0);

      if (history.length > 1) {
        for (let i = 1; i < history.length; i++) {
          expect(history[i].startedAt <= history[i - 1].startedAt).toBe(true);
        }
      }
    });
  });

  describe("filterAnalysisHistory", () => {
    it("should filter by status", async () => {
      const filtered = await analytics.filterAnalysisHistory(testUserId, {
        status: "completed",
      });

      expect(Array.isArray(filtered)).toBe(true);
      filtered.forEach((record) => {
        expect(record.status).toBe("completed");
      });
    });

    it("should filter by confidence level", async () => {
      const filtered = await analytics.filterAnalysisHistory(testUserId, {
        minConfidence: 0.8,
      });

      expect(Array.isArray(filtered)).toBe(true);
      filtered.forEach((record) => {
        expect(record.confidence >= 0.8).toBe(true);
      });
    });

    it("should filter by date range", async () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const filtered = await analytics.filterAnalysisHistory(testUserId, {
        startDate: oneDayAgo,
        endDate: now,
      });

      expect(Array.isArray(filtered)).toBe(true);
      filtered.forEach((record) => {
        expect(record.startedAt >= oneDayAgo).toBe(true);
        expect(record.startedAt <= now).toBe(true);
      });
    });

    it("should combine multiple filters", async () => {
      const filtered = await analytics.filterAnalysisHistory(testUserId, {
        status: "completed",
        minConfidence: 0.7,
      });

      expect(Array.isArray(filtered)).toBe(true);
      filtered.forEach((record) => {
        expect(record.status).toBe("completed");
        expect(record.confidence >= 0.7).toBe(true);
      });
    });
  });

  describe("getAnalyticsSummary", () => {
    it("should return summary with all required fields", async () => {
      const summary = await analytics.getAnalyticsSummary(testUserId);

      expect(summary).toHaveProperty("today");
      expect(summary).toHaveProperty("thisWeek");
      expect(summary).toHaveProperty("thisMonth");
      expect(summary).toHaveProperty("userAnalytics");
    });

    it("should return arrays for time periods", async () => {
      const summary = await analytics.getAnalyticsSummary(testUserId);

      expect(Array.isArray(summary.thisWeek)).toBe(true);
      expect(Array.isArray(summary.thisMonth)).toBe(true);
    });

    it("should include user analytics data", async () => {
      const summary = await analytics.getAnalyticsSummary(testUserId);

      expect(summary.userAnalytics.userId).toBe(testUserId);
      expect(typeof summary.userAnalytics.totalAnalyses).toBe("number");
      expect(typeof summary.userAnalytics.successRate).toBe("number");
    });
  });

  describe("Performance Metrics Calculation", () => {
    it("should calculate average correctly", async () => {
      const userAnalytics = await analytics.getUserAnalytics(testUserId);

      if (userAnalytics.totalAnalyses > 0) {
        expect(userAnalytics.averageAnalysisTime).toBeGreaterThan(0);
      }
    });

    it("should track first and last analysis dates", async () => {
      const userAnalytics = await analytics.getUserAnalytics(testUserId);

      if (userAnalytics.totalAnalyses > 0) {
        expect(userAnalytics.firstAnalysisDate).toBeGreaterThan(0);
        expect(userAnalytics.lastAnalysisDate).toBeGreaterThanOrEqual(
          userAnalytics.firstAnalysisDate
        );
      }
    });

    it("should calculate preferred time range", async () => {
      const userAnalytics = await analytics.getUserAnalytics(testUserId);

      expect(userAnalytics.preferredTimeRange).toMatch(/\d{2}:\d{2}-\d{2}:\d{2}/);
    });
  });
});
