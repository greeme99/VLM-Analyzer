# Firestore Realtime Database 실시간 분석 진행률 가이드

## 개요

이 가이드는 Firestore Realtime Database를 활용하여 비디오 분석 진행률을 사용자에게 실시간으로 표시하는 방법을 설명합니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    클라이언트 (브라우저)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useAnalysisProgress Hook                            │   │
│  │  - Firebase Realtime Database 리스너 설정            │   │
│  │  - 실시간 진행률 업데이트 수신                        │   │
│  │  - 상태 관리 (progress, isLoading, error)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AnalysisProgressTracker Component                   │   │
│  │  - 진행률 바 표시                                     │   │
│  │  - 프레임 처리 진행률                                │   │
│  │  - 남은 시간 계산                                     │   │
│  │  - 상태별 메시지 표시                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕ (WebSocket)
┌─────────────────────────────────────────────────────────────┐
│            Firebase Realtime Database (클라우드)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  analysis/{projectId}/progress                       │   │
│  │  - status: pending|preparing|analyzing|processing    │   │
│  │  - percentage: 0-100                                 │   │
│  │  - currentStep: 1-4                                  │   │
│  │  - message: 사용자 친화적 메시지                      │   │
│  │  - framesProcessed: 처리된 프레임 수                 │   │
│  │  - totalFrames: 전체 프레임 수                       │   │
│  │  - estimatedRemainingTime: 예상 남은 시간            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                    백엔드 (Node.js)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  analyzeVideoWithProgress()                          │   │
│  │  - 진행률 초기화                                      │   │
│  │  - 각 단계별 진행률 업데이트                          │   │
│  │  - 프레임 처리 진행률 추적                            │   │
│  │  - 완료/실패 상태 업데이트                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 데이터 구조

### Realtime Database 경로

```
analysis/
├── {projectId}/
│   ├── progress/
│   │   ├── projectId: string
│   │   ├── userId: string
│   │   ├── status: "pending" | "preparing" | "analyzing" | "processing" | "completed" | "failed"
│   │   ├── currentStep: number (1-4)
│   │   ├── totalSteps: number
│   │   ├── percentage: number (0-100)
│   │   ├── message: string
│   │   ├── startedAt: number (timestamp)
│   │   ├── updatedAt: number (timestamp)
│   │   ├── estimatedRemainingTime: number (milliseconds)
│   │   ├── framesProcessed: number
│   │   ├── totalFrames: number
│   │   ├── currentFrameRate: number (fps)
│   │   └── errorMessage?: string
│   │
│   └── result/
│       ├── frames: array
│       ├── totalDuration: number
│       ├── summary: string
│       ├── totalMods: number
│       ├── standardTime: string
│       └── completedAt: number
```

## 백엔드 구현

### 1. 분석 진행률 초기화

```typescript
import { initializeAnalysisProgress } from "./server/_core/firebase-realtime";

// 분석 시작 시
await initializeAnalysisProgress(projectId, userId, 4); // 4단계 분석
```

### 2. 진행률 업데이트

```typescript
import { updateAnalysisProgress } from "./server/_core/firebase-realtime";

// 단계별 진행률 업데이트
await updateAnalysisProgress(projectId, {
  currentStep: 1,
  status: "preparing",
  percentage: 25,
  message: "비디오 준비 중...",
});
```

### 3. 프레임 처리 진행률 추적

```typescript
import { updateFrameProgress } from "./server/_core/firebase-realtime";

// 프레임 처리 중
for (let i = 0; i < totalFrames; i++) {
  const frameRate = calculateFrameRate(); // fps
  await updateFrameProgress(projectId, i + 1, totalFrames, frameRate);
  
  // 프레임 처리 로직
  processFrame(frames[i]);
}
```

### 4. 분석 완료

```typescript
import { markAnalysisComplete } from "./server/_core/firebase-realtime";

const result = {
  frames: processedFrames,
  totalDuration: duration,
  summary: "분석 완료",
  totalMods: totalMods,
  standardTime: standardTime,
};

await markAnalysisComplete(projectId, result);
```

### 5. 오류 처리

```typescript
import { markAnalysisFailed } from "./server/_core/firebase-realtime";

try {
  // 분석 로직
} catch (error) {
  await markAnalysisFailed(projectId, error.message);
}
```

## 프론트엔드 구현

### 1. 진행률 추적 훅 사용

```typescript
import { useAnalysisProgress } from "../hooks/useAnalysisProgress";

function MyComponent() {
  const { progress, isLoading, error } = useAnalysisProgress(projectId);

  if (isLoading) return <div>연결 중...</div>;
  if (error) return <div>오류: {error}</div>;
  if (!progress) return null;

  return (
    <div>
      <div>진행률: {progress.percentage}%</div>
      <div>상태: {progress.status}</div>
      <div>메시지: {progress.message}</div>
    </div>
  );
}
```

### 2. 진행률 표시 컴포넌트 사용

```typescript
import AnalysisProgressTracker from "../components/AnalysisProgressTracker";

function AnalysisPage() {
  return (
    <div>
      <AnalysisProgressTracker projectId={projectId} showDetails={true} />
    </div>
  );
}
```

### 3. 사용자의 모든 진행 중인 분석 추적

```typescript
import { useUserActiveAnalysis } from "../hooks/useAnalysisProgress";

function DashboardPage() {
  const { analyses, activeCount } = useUserActiveAnalysis(userId);

  return (
    <div>
      <h2>진행 중인 분석: {activeCount}</h2>
      {Object.entries(analyses).map(([projectId, progress]) => (
        <div key={projectId}>
          <p>{progress.message}</p>
          <Progress value={progress.percentage} />
        </div>
      ))}
    </div>
  );
}
```

## 진행률 단계

### 4단계 분석 프로세스

| 단계 | 상태 | 진행률 | 설명 |
|------|------|--------|------|
| 1 | preparing | 25% | 비디오 준비 (메타데이터 추출, 프레임 로드) |
| 2 | analyzing | 50% | VLM 분석 (Gemini API 호출, 프레임 처리) |
| 3 | processing | 75% | 결과 처리 (MODAPTS 코드 변환, 표준시간 계산) |
| 4 | completed | 100% | 완료 (결과 저장, 정리) |

## 성능 최적화

### 1. 배치 업데이트

```typescript
import { batchUpdateProgress } from "./server/_core/firebase-realtime";

// 여러 프로젝트의 진행률을 한 번에 업데이트
await batchUpdateProgress({
  "project-1": { percentage: 50, currentStep: 2 },
  "project-2": { percentage: 75, currentStep: 3 },
  "project-3": { percentage: 100, currentStep: 4 },
});
```

### 2. 리스너 정리

```typescript
// 자동으로 정리됨 (useEffect cleanup)
useEffect(() => {
  // 리스너 설정
  return () => {
    // 리스너 정리
  };
}, [projectId]);
```

### 3. 진행률 정리

```typescript
import { cleanupAnalysisProgress } from "./server/_core/firebase-realtime";

// 분석 완료 후 1시간 뒤 자동 정리
await cleanupAnalysisProgress(projectId, 3600000);
```

## 실시간 기능 테스트

### 로컬 테스트

```bash
# Firebase Realtime Database 테스트
pnpm test server/firebase-realtime.test.ts

# 전체 테스트
pnpm test
```

### 수동 테스트

1. 분석 시작
2. 브라우저 콘솔에서 진행률 확인
3. Firebase Console에서 Realtime Database 데이터 확인
4. 진행률이 실시간으로 업데이트되는지 확인

## 트러블슈팅

### 1. 진행률이 업데이트되지 않음

**확인 사항:**
- Firebase Realtime Database URL이 올바른지 확인
- 환경 변수 `FIREBASE_DATABASE_URL` 확인
- 보안 규칙이 읽기/쓰기를 허용하는지 확인

```
// Firebase Console → Realtime Database → Rules
{
  "rules": {
    "analysis": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 2. 연결이 끊김

**해결책:**
- 네트워크 연결 확인
- Firebase 서비스 상태 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 3. 성능 저하

**최적화:**
- 불필요한 리스너 제거
- 배치 업데이트 사용
- 진행률 업데이트 빈도 조절

## 보안 규칙

### 권장 보안 규칙

```json
{
  "rules": {
    "analysis": {
      "{projectId}": {
        "progress": {
          ".read": "root.child('projects').child(data.child('projectId')).child('userId').val() === auth.uid",
          ".write": "root.child('projects').child(data.child('projectId')).child('userId').val() === auth.uid"
        },
        "result": {
          ".read": "root.child('projects').child(data.child('projectId')).child('userId').val() === auth.uid",
          ".write": false
        }
      }
    }
  }
}
```

## 비용 추정

### Firebase Realtime Database 가격

| 항목 | 무료 | 가격 |
|------|------|------|
| 동시 연결 | 100 | $1/100 연결/월 |
| 저장 공간 | 1GB | $5/GB/월 |
| 다운로드 | 10GB/월 | $1/GB |
| 업로드 | 10GB/월 | $1/GB |

### 예상 월 비용 (중소 규모)
- 동시 사용자: 50명
- 진행률 업데이트 빈도: 1초마다
- 월 비용: $0-5

## 다음 단계

1. **WebSocket 최적화**: 연결 풀링 및 재연결 로직 개선
2. **알림 시스템**: 분석 완료 시 사용자에게 알림
3. **분석 이력**: 과거 분석 진행률 기록 저장
4. **성능 모니터링**: 분석 시간 추적 및 최적화

## 참고 자료

- [Firebase Realtime Database 문서](https://firebase.google.com/docs/database)
- [Firebase JavaScript SDK](https://firebase.google.com/docs/database/web/start)
- [Realtime Database 보안 규칙](https://firebase.google.com/docs/database/security)
