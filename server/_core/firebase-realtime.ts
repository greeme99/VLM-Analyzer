import { initializeFirebase } from "./firebase";
import * as admin from "firebase-admin";

/**
 * Firebase Realtime Database Helper Functions
 * Handles real-time progress tracking for video analysis
 */

interface AnalysisProgress {
  projectId: string;
  userId: string;
  status: "pending" | "preparing" | "analyzing" | "processing" | "completed" | "failed";
  currentStep: number;
  totalSteps: number;
  percentage: number;
  message: string;
  startedAt: number;
  updatedAt: number;
  estimatedRemainingTime?: number;
  framesProcessed?: number;
  totalFrames?: number;
  currentFrameRate?: number;
  errorMessage?: string;
}

/**
 * Realtime Database 참조 가져오기
 */
export async function getRealtimeDb() {
  const app = await initializeFirebase();
  return admin.database(app);
}

/**
 * 분석 진행률 초기화
 */
export async function initializeAnalysisProgress(
  projectId: string,
  userId: string,
  totalSteps: number = 3
): Promise<void> {
  const db = await getRealtimeDb();
  const progressRef = db.ref(`analysis/${projectId}/progress`);

  const progress: AnalysisProgress = {
    projectId,
    userId,
    status: "pending",
    currentStep: 0,
    totalSteps,
    percentage: 0,
    message: "분석 준비 중...",
    startedAt: Date.now(),
    updatedAt: Date.now(),
    framesProcessed: 0,
    totalFrames: 0,
    currentFrameRate: 0,
  };

  await progressRef.set(progress);
  console.log(`[Realtime DB] Analysis progress initialized for project ${projectId}`);
}

/**
 * 분석 진행률 업데이트
 */
export async function updateAnalysisProgress(
  projectId: string,
  updates: Partial<AnalysisProgress>
): Promise<void> {
  const db = await getRealtimeDb();
  const progressRef = db.ref(`analysis/${projectId}/progress`);

  const updatedData = {
    ...updates,
    updatedAt: Date.now(),
  };

  await progressRef.update(updatedData);
  console.log(`[Realtime DB] Progress updated for project ${projectId}:`, updatedData);
}

/**
 * 분석 진행률 조회
 */
export async function getAnalysisProgress(projectId: string): Promise<AnalysisProgress | null> {
  const db = await getRealtimeDb();
  const progressRef = db.ref(`analysis/${projectId}/progress`);

  const snapshot = await progressRef.get();
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * 분석 진행률 리스너 설정 (서버 측)
 */
export function watchAnalysisProgress(
  projectId: string,
  callback: (progress: AnalysisProgress) => void
): () => void {
  getRealtimeDb().then((db) => {
    const progressRef = db.ref(`analysis/${projectId}/progress`);

    const listener = progressRef.on("value", (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });

    console.log(`[Realtime DB] Watching progress for project ${projectId}`);
  });

  // 리스너 제거 함수 반환
  return () => {
    getRealtimeDb().then((db) => {
      db.ref(`analysis/${projectId}/progress`).off();
      console.log(`[Realtime DB] Stopped watching progress for project ${projectId}`);
    });
  };
}

/**
 * 프레임 처리 진행률 업데이트
 */
export async function updateFrameProgress(
  projectId: string,
  framesProcessed: number,
  totalFrames: number,
  currentFrameRate: number
): Promise<void> {
  const percentage = Math.round((framesProcessed / totalFrames) * 100);
  const estimatedRemainingTime =
    currentFrameRate > 0 ? Math.round(((totalFrames - framesProcessed) / currentFrameRate) * 1000) : 0;

  await updateAnalysisProgress(projectId, {
    currentStep: 2,
    status: "analyzing",
    percentage,
    message: `분석 중... (${framesProcessed}/${totalFrames} 프레임)`,
    framesProcessed,
    totalFrames,
    currentFrameRate,
    estimatedRemainingTime,
  });
}

/**
 * 분석 완료 표시
 */
export async function markAnalysisComplete(
  projectId: string,
  analysisResult?: any
): Promise<void> {
  const db = await getRealtimeDb();

  // 진행률 업데이트
  await updateAnalysisProgress(projectId, {
    currentStep: 3,
    status: "completed",
    percentage: 100,
    message: "분석 완료!",
  });

  // 분석 결과 저장
  if (analysisResult) {
    const resultRef = db.ref(`analysis/${projectId}/result`);
    await resultRef.set({
      ...analysisResult,
      completedAt: Date.now(),
    });
  }

  console.log(`[Realtime DB] Analysis completed for project ${projectId}`);
}

/**
 * 분석 실패 표시
 */
export async function markAnalysisFailed(projectId: string, errorMessage: string): Promise<void> {
  await updateAnalysisProgress(projectId, {
    status: "failed",
    message: "분석 실패",
    errorMessage,
  });

  console.log(`[Realtime DB] Analysis failed for project ${projectId}: ${errorMessage}`);
}

/**
 * 분석 진행률 정리 (완료 후)
 */
export async function cleanupAnalysisProgress(projectId: string, delayMs: number = 3600000): Promise<void> {
  // 1시간 후 자동 정리
  setTimeout(async () => {
    const db = await getRealtimeDb();
    await db.ref(`analysis/${projectId}`).remove();
    console.log(`[Realtime DB] Analysis progress cleaned up for project ${projectId}`);
  }, delayMs);
}

/**
 * 사용자의 모든 진행 중인 분석 조회
 */
export async function getUserActiveAnalysis(userId: string): Promise<Record<string, AnalysisProgress>> {
  const db = await getRealtimeDb();
  const analysisRef = db.ref("analysis");

  const snapshot = await analysisRef.get();
  if (!snapshot.exists()) {
    return {};
  }

  const allAnalysis = snapshot.val();
  const userAnalysis: Record<string, AnalysisProgress> = {};

  for (const [projectId, data] of Object.entries(allAnalysis)) {
    const progress = (data as any).progress;
    if (progress && progress.userId === userId && progress.status !== "completed" && progress.status !== "failed") {
      userAnalysis[projectId] = progress;
    }
  }

  return userAnalysis;
}

/**
 * 실시간 데이터베이스 연결 상태 확인
 */
export async function checkRealtimeDatabaseConnection(): Promise<boolean> {
  try {
    const db = await getRealtimeDb();
    const connectedRef = db.ref(".info/connected");

    return new Promise((resolve) => {
      connectedRef.on("value", (snapshot) => {
        resolve(snapshot.val() === true);
      });
    });
  } catch (error) {
    console.error("[Realtime DB] Connection check failed:", error);
    return false;
  }
}

/**
 * 배치 진행률 업데이트 (여러 프로젝트)
 */
export async function batchUpdateProgress(
  updates: Record<string, Partial<AnalysisProgress>>
): Promise<void> {
  const db = await getRealtimeDb();
  const batch: Record<string, any> = {};

  for (const [projectId, progressUpdate] of Object.entries(updates)) {
    batch[`analysis/${projectId}/progress`] = {
      ...progressUpdate,
      updatedAt: Date.now(),
    };
  }

  await db.ref().update(batch);
  console.log(`[Realtime DB] Batch update completed for ${Object.keys(updates).length} projects`);
}

export default {
  getRealtimeDb,
  initializeAnalysisProgress,
  updateAnalysisProgress,
  getAnalysisProgress,
  watchAnalysisProgress,
  updateFrameProgress,
  markAnalysisComplete,
  markAnalysisFailed,
  cleanupAnalysisProgress,
  getUserActiveAnalysis,
  checkRealtimeDatabaseConnection,
  batchUpdateProgress,
};
