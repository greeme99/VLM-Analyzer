import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  recordAnalysis,
  getUserAnalytics,
  getPerformanceMetrics,
  getAnalysisHistory,
  filterAnalysisHistory,
  getAnalyticsSummary,
} from "./analytics";

/**
 * 대시보드 관련 tRPC 라우터
 * 분석 이력, 성능 통계, 사용자 분석 데이터 조회
 */

export const dashboardRouter = router({
  /**
   * 분석 이력 조회
   */
  getAnalysisHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const history = await getAnalysisHistory(String(ctx.user.id), input.limit, input.offset);
      return {
        data: history,
        total: history.length,
      };
    }),

  /**
   * 분석 이력 필터링
   */
  filterAnalysisHistory: protectedProcedure
    .input(
      z.object({
        status: z.enum(["completed", "failed"]).optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        minConfidence: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const filtered = await filterAnalysisHistory(String(ctx.user.id), input);
      return {
        data: filtered,
        total: filtered.length,
      };
    }),

  /**
   * 사용자 분석 통계 조회
   */
  getUserAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const analytics = await getUserAnalytics(String(ctx.user.id));
    return analytics;
  }),

  /**
   * 기간별 성능 통계 조회
   */
  getPerformanceMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
      })
    )
    .query(async ({ ctx, input }) => {
      const metrics = await getPerformanceMetrics(String(ctx.user.id), input.startDate, input.endDate);
      return {
        data: metrics,
        total: metrics.length,
      };
    }),

  /**
   * 분석 통계 요약 조회
   */
  getAnalyticsSummary: protectedProcedure.query(async ({ ctx }) => {
    const summary = await getAnalyticsSummary(String(ctx.user.id));
    return summary;
  }),

  /**
   * 대시보드 메인 데이터 조회 (모든 통계)
   */
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const [summary, history] = await Promise.all([
      getAnalyticsSummary(String(ctx.user.id)),
      getAnalysisHistory(String(ctx.user.id), 10, 0), // 최근 10개
    ]);

    return {
      summary,
      recentAnalyses: history,
      timestamp: Date.now(),
    };
  }),

  /**
   * 성공률 통계
   */
  getSuccessRateStats: protectedProcedure.query(async ({ ctx }) => {
    const analytics = await getUserAnalytics(String(ctx.user.id));
    const history = await getAnalysisHistory(String(ctx.user.id), 1000, 0);

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const calculateSuccessRate = (records: typeof history) => {
      if (records.length === 0) return 0;
      const successful = records.filter((r) => r.status === "completed").length;
      return Math.round((successful / records.length) * 100);
    };

    const todayRecords = history.filter(
      (r) => new Date(r.startedAt * 1000).toISOString().split("T")[0] === today
    );
    const weekRecords = history.filter(
      (r) => new Date(r.startedAt * 1000).toISOString().split("T")[0] >= weekAgo
    );
    const monthRecords = history.filter(
      (r) => new Date(r.startedAt * 1000).toISOString().split("T")[0] >= monthAgo
    );

    return {
      today: calculateSuccessRate(todayRecords),
      thisWeek: calculateSuccessRate(weekRecords),
      thisMonth: calculateSuccessRate(monthRecords),
      overall: Math.round(analytics.successRate),
    };
  }),

  /**
   * 분석 시간 통계
   */
  getAnalysisTimeStats: protectedProcedure.query(async ({ ctx }) => {
    const history = await getAnalysisHistory(String(ctx.user.id), 1000, 0);

    if (history.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        median: 0,
      };
    }

    const durations = history.map((r) => r.duration).sort((a, b) => a - b);
    const average = durations.reduce((a, b) => a + b, 0) / durations.length;
    const median = durations[Math.floor(durations.length / 2)];

    return {
      average: Math.round(average),
      min: Math.min(...durations),
      max: Math.max(...durations),
      median,
    };
  }),

  /**
   * 신뢰도 통계
   */
  getConfidenceStats: protectedProcedure.query(async ({ ctx }) => {
    const history = await getAnalysisHistory(String(ctx.user.id), 1000, 0);
    const successfulRecords = history.filter((r) => r.status === "completed");

    if (successfulRecords.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        distribution: {
          "0-20": 0,
          "20-40": 0,
          "40-60": 0,
          "60-80": 0,
          "80-100": 0,
        },
      };
    }

    const confidences = successfulRecords.map((r) => r.confidence);
    const average = confidences.reduce((a, b) => a + b, 0) / confidences.length;

    const distribution = {
      "0-20": confidences.filter((c) => c < 20).length,
      "20-40": confidences.filter((c) => c >= 20 && c < 40).length,
      "40-60": confidences.filter((c) => c >= 40 && c < 60).length,
      "60-80": confidences.filter((c) => c >= 60 && c < 80).length,
      "80-100": confidences.filter((c) => c >= 80).length,
    };

    return {
      average: Math.round(average * 100) / 100,
      min: Math.min(...confidences),
      max: Math.max(...confidences),
      distribution,
    };
  }),

  /**
   * 프레임 처리 통계
   */
  getFrameProcessingStats: protectedProcedure.query(async ({ ctx }) => {
    const history = await getAnalysisHistory(String(ctx.user.id), 1000, 0);
    const successfulRecords = history.filter((r) => r.status === "completed");

    if (successfulRecords.length === 0) {
      return {
        averageFrames: 0,
        averageMods: 0,
        totalFrames: 0,
        totalMods: 0,
      };
    }

    const totalFrames = successfulRecords.reduce((sum, r) => sum + r.framesCount, 0);
    const totalMods = successfulRecords.reduce((sum, r) => sum + r.modsCount, 0);

    return {
      averageFrames: Math.round(totalFrames / successfulRecords.length),
      averageMods: Math.round(totalMods / successfulRecords.length),
      totalFrames,
      totalMods,
    };
  }),

  /**
   * 시간대별 분석 활동 통계
   */
  getHourlyActivityStats: protectedProcedure.query(async ({ ctx }) => {
    const history = await getAnalysisHistory(String(ctx.user.id), 1000, 0);

    const hourlyData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    history.forEach((r) => {
      const hour = new Date(r.startedAt * 1000).getHours();
      hourlyData[hour]++;
    });

    return Object.entries(hourlyData).map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));
  }),

  /**
   * 요일별 분석 활동 통계
   */
  getDailyActivityStats: protectedProcedure.query(async ({ ctx }) => {
    const history = await getAnalysisHistory(String(ctx.user.id), 1000, 0);

    const dailyData: Record<number, number> = {};
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    for (let i = 0; i < 7; i++) {
      dailyData[i] = 0;
    }

    history.forEach((r) => {
      const day = new Date(r.startedAt * 1000).getDay();
      dailyData[day]++;
    });

    return Object.entries(dailyData).map(([day, count]) => ({
      day: dayNames[parseInt(day)],
      count,
    }));
  }),
});

export default dashboardRouter;
