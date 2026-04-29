import React from "react";
import { useAnalysisProgress, getProgressStatus, formatRemainingTime } from "../hooks/useAnalysisProgress";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

interface AnalysisProgressTrackerProps {
  projectId: string | null;
  showDetails?: boolean;
}

export function AnalysisProgressTracker({
  projectId,
  showDetails = true,
}: AnalysisProgressTrackerProps) {
  const { progress, isLoading, error } = useAnalysisProgress(projectId);

  if (!projectId) {
    return null;
  }

  if (isLoading && !progress) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>분석 진행률</CardTitle>
          <CardDescription>연결 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>진행률 추적 오류: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!progress) {
    return null;
  }

  const status = getProgressStatus(progress);
  const remainingTime = formatRemainingTime(progress.estimatedRemainingTime);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{status.icon}</span>
              분석 진행률
            </CardTitle>
            <CardDescription>{progress.message}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{progress.percentage}%</div>
            <div className="text-sm text-gray-500">{status.label}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">전체 진행률</span>
            <span className="text-gray-600">
              {progress.currentStep} / {progress.totalSteps}
            </span>
          </div>
          <Progress value={progress.percentage} className="h-3" />
        </div>

        {showDetails && progress.framesProcessed !== undefined && progress.totalFrames !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">프레임 처리</span>
              <span className="text-gray-600">
                {progress.framesProcessed} / {progress.totalFrames}
              </span>
            </div>
            <Progress
              value={
                progress.totalFrames > 0
                  ? Math.round((progress.framesProcessed / progress.totalFrames) * 100)
                  : 0
              }
              className="h-2"
            />
          </div>
        )}

        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            {progress.currentFrameRate !== undefined && (
              <div>
                <div className="text-xs text-gray-500">처리 속도</div>
                <div className="text-sm font-medium">
                  {progress.currentFrameRate.toFixed(1)} fps
                </div>
              </div>
            )}

            {progress.estimatedRemainingTime !== undefined && (
              <div>
                <div className="text-xs text-gray-500">예상 남은 시간</div>
                <div className="text-sm font-medium">{remainingTime}</div>
              </div>
            )}

            <div>
              <div className="text-xs text-gray-500">경과 시간</div>
              <div className="text-sm font-medium">
                {formatRemainingTime(Date.now() - progress.startedAt)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">상태</div>
              <div className={`text-sm font-medium px-2 py-1 rounded text-white ${status.color}`}>
                {status.label}
              </div>
            </div>
          </div>
        )}

        {progress.errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{progress.errorMessage}</AlertDescription>
          </Alert>
        )}

        {progress.status === "completed" && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">분석이 완료되었습니다!</AlertDescription>
          </Alert>
        )}

        {progress.status === "failed" && (
          <Alert variant="destructive">
            <AlertDescription>분석 중 오류가 발생했습니다.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default AnalysisProgressTracker;
