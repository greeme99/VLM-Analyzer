import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export interface ProgressUpdate {
  projectId: number;
  stage: "extracting" | "detecting" | "analyzing" | "calculating" | "completed" | "error";
  progress: number;
  message: string;
  timestamp: number;
  error?: string;
}

interface AnalysisProgressProps {
  projectId: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

const STAGE_NAMES: Record<ProgressUpdate["stage"], string> = {
  extracting: "프레임 추출",
  detecting: "동작 감지",
  analyzing: "분석 중",
  calculating: "계산 중",
  completed: "완료",
  error: "오류",
};

export function AnalysisProgress({ projectId, onComplete, onError }: AnalysisProgressProps) {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource(`/api/analysis/progress/${projectId}`);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log("[Progress] Connected to analysis progress stream");
    };

    eventSource.onmessage = (event) => {
      try {
        const update: ProgressUpdate = JSON.parse(event.data);
        setProgress(update);

        if (update.stage === "completed") {
          eventSource.close();
          setIsConnected(false);
          onComplete?.();
        } else if (update.stage === "error") {
          eventSource.close();
          setIsConnected(false);
          onError?.(update.error || "분석 중 오류가 발생했습니다");
        }
      } catch (error) {
        console.error("[Progress] Error parsing progress update:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[Progress] EventSource error:", error);
      eventSource.close();
      setIsConnected(false);
      onError?.("연결이 끊어졌습니다");
    };

    return () => {
      eventSource.close();
    };
  }, [projectId, onComplete, onError]);

  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            분석 준비 중...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const isCompleted = progress.stage === "completed";
  const isError = progress.stage === "error";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : isError ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          )}
          {STAGE_NAMES[progress.stage]}
        </CardTitle>
        <CardDescription>{progress.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>진행률</span>
            <span className="font-semibold">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>

        {isError && progress.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {progress.error}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          업데이트: {new Date(progress.timestamp).toLocaleTimeString("ko-KR")}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Lightweight progress indicator for sidebar/header
 */
export function AnalysisProgressIndicator({ projectId }: { projectId: number }) {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const eventSource = new EventSource(`/api/analysis/progress/${projectId}`);

    eventSource.onmessage = (event) => {
      try {
        const update: ProgressUpdate = JSON.parse(event.data);
        setProgress(update.progress);

        if (update.stage === "completed" || update.stage === "error") {
          eventSource.close();
        }
      } catch (error) {
        console.error("[Progress] Error parsing update:", error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [projectId]);

  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  );
}
