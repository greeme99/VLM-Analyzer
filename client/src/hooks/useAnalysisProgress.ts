import { useEffect, useState, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off, Database } from "firebase/database";

/**
 * Firebase Realtime Database 진행률 추적 훅
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

// Firebase 설정 (클라이언트 측)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_WEB_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

let firebaseApp: ReturnType<typeof initializeApp> | null = null;
let realtimeDb: Database | null = null;

/**
 * Firebase Realtime Database 초기화
 */
function initializeFirebaseRealtimeDb() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }

  if (!realtimeDb) {
    realtimeDb = getDatabase(firebaseApp);
  }

  return realtimeDb;
}

/**
 * 분석 진행률 실시간 추적 훅
 */
export function useAnalysisProgress(projectId: string | null) {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    try {
      setIsLoading(true);
      const db = initializeFirebaseRealtimeDb();

      // Realtime Database 리스너 설정
      const progressRef = ref(db, `analysis/${projectId}/progress`);

      const unsubscribe = onValue(
        progressRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setProgress(data);
            setError(null);
          } else {
            setProgress(null);
          }
          setIsLoading(false);
        },
        (err) => {
          console.error("[useAnalysisProgress] Error:", err);
          setError(err.message);
          setIsLoading(false);
        }
      );

      unsubscribeRef.current = () => {
        off(progressRef);
        unsubscribe();
      };

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error("[useAnalysisProgress] Initialization error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    progress,
    isLoading,
    error,
  };
}

/**
 * 사용자의 모든 진행 중인 분석 추적 훅
 */
export function useUserActiveAnalysis(userId: string | null) {
  const [analyses, setAnalyses] = useState<Record<string, AnalysisProgress>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    try {
      setIsLoading(true);
      const db = initializeFirebaseRealtimeDb();

      // 모든 분석 리스너 설정
      const analysisRef = ref(db, "analysis");

      const unsubscribe = onValue(
        analysisRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const allAnalysis = snapshot.val();
            const userAnalyses: Record<string, AnalysisProgress> = {};

            // 사용자의 진행 중인 분석만 필터링
            for (const [projectId, data] of Object.entries(allAnalysis)) {
              const progress = (data as any).progress;
              if (
                progress &&
                progress.userId === userId &&
                progress.status !== "completed" &&
                progress.status !== "failed"
              ) {
                userAnalyses[projectId] = progress;
              }
            }

            setAnalyses(userAnalyses);
            setError(null);
          } else {
            setAnalyses({});
          }
          setIsLoading(false);
        },
        (err) => {
          console.error("[useUserActiveAnalysis] Error:", err);
          setError(err.message);
          setIsLoading(false);
        }
      );

      unsubscribeRef.current = () => {
        off(analysisRef);
        unsubscribe();
      };

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error("[useUserActiveAnalysis] Initialization error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
    }
  }, [userId]);

  return {
    analyses,
    isLoading,
    error,
    activeCount: Object.keys(analyses).length,
  };
}

/**
 * 분석 결과 실시간 추적 훅
 */
export function useAnalysisResult(projectId: string | null) {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    try {
      setIsLoading(true);
      const db = initializeFirebaseRealtimeDb();

      // 분석 결과 리스너 설정
      const resultRef = ref(db, `analysis/${projectId}/result`);

      const unsubscribe = onValue(
        resultRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setResult(data);
            setError(null);
          } else {
            setResult(null);
          }
          setIsLoading(false);
        },
        (err) => {
          console.error("[useAnalysisResult] Error:", err);
          setError(err.message);
          setIsLoading(false);
        }
      );

      unsubscribeRef.current = () => {
        off(resultRef);
        unsubscribe();
      };

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error("[useAnalysisResult] Initialization error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    result,
    isLoading,
    error,
  };
}

/**
 * 진행률 상태 계산 유틸리티
 */
export function getProgressStatus(progress: AnalysisProgress | null) {
  if (!progress) {
    return {
      label: "대기 중",
      color: "bg-gray-500",
      icon: "⏳",
    };
  }

  switch (progress.status) {
    case "pending":
      return {
        label: "대기 중",
        color: "bg-gray-500",
        icon: "⏳",
      };
    case "preparing":
      return {
        label: "준비 중",
        color: "bg-blue-500",
        icon: "📹",
      };
    case "analyzing":
      return {
        label: "분석 중",
        color: "bg-purple-500",
        icon: "🔍",
      };
    case "processing":
      return {
        label: "처리 중",
        color: "bg-orange-500",
        icon: "⚙️",
      };
    case "completed":
      return {
        label: "완료",
        color: "bg-green-500",
        icon: "✅",
      };
    case "failed":
      return {
        label: "실패",
        color: "bg-red-500",
        icon: "❌",
      };
    default:
      return {
        label: "알 수 없음",
        color: "bg-gray-500",
        icon: "❓",
      };
  }
}

/**
 * 남은 시간 포맷팅
 */
export function formatRemainingTime(ms: number | undefined): string {
  if (!ms || ms <= 0) {
    return "계산 중...";
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  } else if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`;
  } else {
    return `${seconds}초`;
  }
}

export default {
  useAnalysisProgress,
  useUserActiveAnalysis,
  useAnalysisResult,
  getProgressStatus,
  formatRemainingTime,
};
