import { getRealtimeDb } from "./_core/firebase-realtime";
import * as admin from "firebase-admin";

/**
 * 분석 이력, 성능 통계, 사용자 분석 데이터 관리
 */

interface AnalysisRecord {
  projectId: string;
  userId: string;
  videoUrl: string;
  videoDuration: number; // 초
  analysisPrompt: string;
  startedAt: number;
  completedAt: number;
  duration: number; // 분석 소요 시간 (초)
  status: "completed" | "failed";
  framesCount: number;
  modsCount: number;
  standardTime: number;
  confidence: number; // 평균 신뢰도
  errorMessage?: string;
}

interface PerformanceMetrics {
  userId: string;
  date: string; // YYYY-MM-DD
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  totalDuration: number; // 초
  averageDuration: number; // 초
  averageFrames: number;
  averageMods: number;
  averageConfidence: number;
  peakTime: string; // HH:mm
  throughput: number; // 분석/시간
}

interface UserAnalytics {
  userId: string;
  totalProjects: number;
  totalAnalyses: number;
  successRate: number; // 0-100
  totalVideoDuration: number; // 초
  totalAnalysisTime: number; // 초
  averageAnalysisTime: number; // 초
  firstAnalysisDate: number;
  lastAnalysisDate: number;
  mostUsedPrompt: string;
  preferredTimeRange: string; // "09:00-12:00" 등
  analysisFrequency: number; // 분석/주
}

/**
 * 분석 이력 기록
 */
export async function recordAnalysis(record: AnalysisRecord): Promise<void> {
  const db = await getRealtimeDb();
  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().split("T")[0];

  // 분석 이력 저장
  const historyRef = db.ref(`analytics/history/${record.userId}/${record.projectId}`);
  await historyRef.set({
    ...record,
    recordedAt: timestamp,
  });

  // 일별 통계 업데이트
  await updateDailyMetrics(record.userId, dateStr, record);

  console.log(`[Analytics] Analysis recorded for project ${record.projectId}`);
}

/**
 * 일별 성능 통계 업데이트
 */
async function updateDailyMetrics(userId: string, dateStr: string, record: AnalysisRecord): Promise<void> {
  const db = await getRealtimeDb();
  const metricsRef = db.ref(`analytics/metrics/${userId}/${dateStr}`);

  const snapshot = await metricsRef.get();
  const currentMetrics = snapshot.exists() ? snapshot.val() : getDefaultMetrics(userId, dateStr);

  const isSuccess = record.status === "completed";
  const updatedMetrics = {
    ...currentMetrics,
    totalAnalyses: currentMetrics.totalAnalyses + 1,
    successfulAnalyses: currentMetrics.successfulAnalyses + (isSuccess ? 1 : 0),
    failedAnalyses: currentMetrics.failedAnalyses + (isSuccess ? 0 : 1),
    totalDuration: currentMetrics.totalDuration + record.duration,
    averageDuration: (currentMetrics.totalDuration + record.duration) / (currentMetrics.totalAnalyses + 1),
    averageFrames:
      (currentMetrics.averageFrames * currentMetrics.totalAnalyses + record.framesCount) /
      (currentMetrics.totalAnalyses + 1),
    averageMods:
      (currentMetrics.averageMods * currentMetrics.totalAnalyses + record.modsCount) /
      (currentMetrics.totalAnalyses + 1),
    averageConfidence:
      (currentMetrics.averageConfidence * currentMetrics.totalAnalyses + record.confidence) /
      (currentMetrics.totalAnalyses + 1),
    throughput: ((currentMetrics.totalAnalyses + 1) / 24) * 60, // 분석/시간
  };

  await metricsRef.set(updatedMetrics);
}

/**
 * 기본 메트릭 구조
 */
function getDefaultMetrics(userId: string, dateStr: string): PerformanceMetrics {
  return {
    userId,
    date: dateStr,
    totalAnalyses: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    totalDuration: 0,
    averageDuration: 0,
    averageFrames: 0,
    averageMods: 0,
    averageConfidence: 0,
    peakTime: "12:00",
    throughput: 0,
  };
}

/**
 * 사용자 분석 통계 조회
 */
export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  const db = await getRealtimeDb();
  const historyRef = db.ref(`analytics/history/${userId}`);

  const snapshot = await historyRef.get();
  if (!snapshot.exists()) {
    return getDefaultUserAnalytics(userId);
  }

  const analyses = snapshot.val();
  const records: AnalysisRecord[] = Object.values(analyses);

  if (records.length === 0) {
    return getDefaultUserAnalytics(userId);
  }

  const successfulRecords = records.filter((r) => r.status === "completed");
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
  const totalVideoDuration = records.reduce((sum, r) => sum + r.videoDuration, 0);
  const averageConfidence =
    successfulRecords.length > 0
      ? successfulRecords.reduce((sum, r) => sum + r.confidence, 0) / successfulRecords.length
      : 0;

  // 가장 많이 사용된 프롬프트
  const promptFrequency: Record<string, number> = {};
  records.forEach((r) => {
    promptFrequency[r.analysisPrompt] = (promptFrequency[r.analysisPrompt] || 0) + 1;
  });
  const mostUsedPrompt = Object.entries(promptFrequency).sort(([, a], [, b]) => b - a)[0]?.[0] || "";

  // 분석 빈도 (주당)
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentAnalyses = records.filter((r) => r.startedAt >= weekAgo);
  const analysisFrequency = recentAnalyses.length;

  return {
    userId,
    totalProjects: records.length,
    totalAnalyses: records.length,
    successRate: (successfulRecords.length / records.length) * 100,
    totalVideoDuration,
    totalAnalysisTime: totalDuration,
    averageAnalysisTime: totalDuration / records.length,
    firstAnalysisDate: Math.min(...records.map((r) => r.startedAt)),
    lastAnalysisDate: Math.max(...records.map((r) => r.startedAt)),
    mostUsedPrompt,
    preferredTimeRange: calculatePreferredTimeRange(records),
    analysisFrequency,
  };
}

/**
 * 기본 사용자 분석 구조
 */
function getDefaultUserAnalytics(userId: string): UserAnalytics {
  return {
    userId,
    totalProjects: 0,
    totalAnalyses: 0,
    successRate: 0,
    totalVideoDuration: 0,
    totalAnalysisTime: 0,
    averageAnalysisTime: 0,
    firstAnalysisDate: 0,
    lastAnalysisDate: 0,
    mostUsedPrompt: "",
    preferredTimeRange: "09:00-17:00",
    analysisFrequency: 0,
  };
}

/**
 * 선호하는 시간대 계산
 */
function calculatePreferredTimeRange(records: AnalysisRecord[]): string {
  const hourFrequency: Record<number, number> = {};

  records.forEach((r) => {
    const hour = new Date(r.startedAt).getHours();
    hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
  });

  const sortedHours = Object.entries(hourFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  if (sortedHours.length === 0) {
    return "09:00-17:00";
  }

  const minHour = Math.min(...sortedHours);
  const maxHour = Math.max(...sortedHours);

  return `${String(minHour).padStart(2, "0")}:00-${String(maxHour + 1).padStart(2, "0")}:00`;
}

/**
 * 기간별 성능 통계 조회
 */
export async function getPerformanceMetrics(
  userId: string,
  startDate: string,
  endDate: string
): Promise<PerformanceMetrics[]> {
  const db = await getRealtimeDb();
  const metricsRef = db.ref(`analytics/metrics/${userId}`);

  const snapshot = await metricsRef.get();
  if (!snapshot.exists()) {
    return [];
  }

  const allMetrics = snapshot.val();
  const metrics: PerformanceMetrics[] = [];

  for (const [date, data] of Object.entries(allMetrics)) {
    if (date >= startDate && date <= endDate) {
      metrics.push(data as PerformanceMetrics);
    }
  }

  return metrics.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 분석 이력 조회 (페이지네이션)
 */
export async function getAnalysisHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AnalysisRecord[]> {
  const db = await getRealtimeDb();
  const historyRef = db.ref(`analytics/history/${userId}`);

  const snapshot = await historyRef.get();
  if (!snapshot.exists()) {
    return [];
  }

  const analyses = Object.values(snapshot.val()) as AnalysisRecord[];

  // 최신순 정렬
  return analyses
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(offset, offset + limit);
}

/**
 * 분석 이력 필터링
 */
export async function filterAnalysisHistory(
  userId: string,
  filters: {
    status?: "completed" | "failed";
    startDate?: number;
    endDate?: number;
    minConfidence?: number;
  }
): Promise<AnalysisRecord[]> {
  const db = await getRealtimeDb();
  const historyRef = db.ref(`analytics/history/${userId}`);

  const snapshot = await historyRef.get();
  if (!snapshot.exists()) {
    return [];
  }

  let analyses = Object.values(snapshot.val()) as AnalysisRecord[];

  if (filters.status) {
    analyses = analyses.filter((a) => a.status === filters.status);
  }

  if (filters.startDate !== undefined) {
    analyses = analyses.filter((a) => a.startedAt >= filters.startDate!);
  }

  if (filters.endDate !== undefined) {
    analyses = analyses.filter((a) => a.startedAt <= filters.endDate!);
  }

  if (filters.minConfidence !== undefined) {
    analyses = analyses.filter((a) => a.confidence >= filters.minConfidence!);
  }

  return analyses.sort((a, b) => b.startedAt - a.startedAt);
}

/**
 * 통계 요약 조회
 */
export async function getAnalyticsSummary(userId: string): Promise<{
  today: PerformanceMetrics | null;
  thisWeek: PerformanceMetrics[];
  thisMonth: PerformanceMetrics[];
  userAnalytics: UserAnalytics;
}> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const db = await getRealtimeDb();
  const metricsRef = db.ref(`analytics/metrics/${userId}`);

  const snapshot = await metricsRef.get();
  const allMetrics = snapshot.exists() ? snapshot.val() : {};

  const todayMetrics = allMetrics[today] || null;
  const thisWeek = (Object.entries(allMetrics)
    .filter(([date]) => date >= weekAgo && date <= today)
    .map(([, data]) => data) as unknown[]) as PerformanceMetrics[];
  const thisMonth = (Object.entries(allMetrics)
    .filter(([date]) => date >= monthAgo && date <= today)
    .map(([, data]) => data) as unknown[]) as PerformanceMetrics[];

  const userAnalytics = await getUserAnalytics(userId);

  return {
    today: todayMetrics,
    thisWeek,
    thisMonth,
    userAnalytics,
  };
}

export default {
  recordAnalysis,
  getUserAnalytics,
  getPerformanceMetrics,
  getAnalysisHistory,
  filterAnalysisHistory,
  getAnalyticsSummary,
};
