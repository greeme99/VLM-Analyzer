/**
 * Real-time Analysis Progress Tracking
 * Uses Server-Sent Events (SSE) for real-time updates
 */

import { EventEmitter } from "events";

export interface ProgressUpdate {
  projectId: number;
  stage: "extracting" | "detecting" | "analyzing" | "calculating" | "completed" | "error";
  progress: number; // 0-100
  message: string;
  timestamp: number;
  error?: string;
}

class AnalysisProgressTracker extends EventEmitter {
  private progressMap: Map<number, ProgressUpdate> = new Map();
  private subscribers: Map<number, Set<(update: ProgressUpdate) => void>> = new Map();

  /**
   * Update progress for a project
   */
  updateProgress(projectId: number, update: Partial<ProgressUpdate>) {
    const current = this.progressMap.get(projectId) || {
      projectId,
      stage: "extracting",
      progress: 0,
      message: "분석 시작",
      timestamp: Date.now(),
    };

    const newUpdate: ProgressUpdate = {
      ...current,
      ...update,
      projectId,
      timestamp: Date.now(),
    };

    this.progressMap.set(projectId, newUpdate);
    this.emit(`progress:${projectId}`, newUpdate);

    // Notify all subscribers
    const subscribers = this.subscribers.get(projectId);
    if (subscribers) {
      subscribers.forEach(callback => callback(newUpdate));
    }

    console.log(`[Progress] Project ${projectId}: ${newUpdate.stage} - ${newUpdate.progress}%`);
  }

  /**
   * Get current progress
   */
  getProgress(projectId: number): ProgressUpdate | undefined {
    return this.progressMap.get(projectId);
  }

  /**
   * Subscribe to progress updates
   */
  subscribe(projectId: number, callback: (update: ProgressUpdate) => void): () => void {
    if (!this.subscribers.has(projectId)) {
      this.subscribers.set(projectId, new Set());
    }

    this.subscribers.get(projectId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(projectId)?.delete(callback);
    };
  }

  /**
   * Clear progress for a project
   */
  clearProgress(projectId: number) {
    this.progressMap.delete(projectId);
    this.subscribers.delete(projectId);
  }
}

export const progressTracker = new AnalysisProgressTracker();

/**
 * Simulate analysis progress for demo
 */
export function simulateAnalysisProgress(projectId: number) {
  const stages: Array<{ stage: ProgressUpdate["stage"]; progress: number; message: string }> = [
    { stage: "extracting", progress: 10, message: "영상 프레임 추출 중..." },
    { stage: "extracting", progress: 25, message: "프레임 추출 완료" },
    { stage: "detecting", progress: 30, message: "손 랜드마크 감지 중..." },
    { stage: "detecting", progress: 50, message: "동작 이벤트 감지 중..." },
    { stage: "detecting", progress: 65, message: "동작 감지 완료" },
    { stage: "analyzing", progress: 70, message: "Gemini 분석 중..." },
    { stage: "analyzing", progress: 85, message: "분석 결과 처리 중..." },
    { stage: "calculating", progress: 90, message: "표준시간 계산 중..." },
    { stage: "calculating", progress: 95, message: "보고서 생성 중..." },
    { stage: "completed", progress: 100, message: "분석 완료" },
  ];

  let stageIndex = 0;

  const interval = setInterval(() => {
    if (stageIndex < stages.length) {
      const stage = stages[stageIndex];
      progressTracker.updateProgress(projectId, {
        stage: stage.stage,
        progress: stage.progress,
        message: stage.message,
      });
      stageIndex++;
    } else {
      clearInterval(interval);
    }
  }, 1000);

  return () => clearInterval(interval);
}

/**
 * Format progress update for SSE
 */
export function formatProgressForSSE(update: ProgressUpdate): string {
  return `data: ${JSON.stringify(update)}\n\n`;
}

/**
 * Get stage display name
 */
export function getStageDisplayName(stage: ProgressUpdate["stage"]): string {
  const names: Record<ProgressUpdate["stage"], string> = {
    extracting: "프레임 추출",
    detecting: "동작 감지",
    analyzing: "분석 중",
    calculating: "계산 중",
    completed: "완료",
    error: "오류",
  };
  return names[stage];
}
