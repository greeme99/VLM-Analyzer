import { invokeLLM } from "./_core/llm";
import {
  initializeAnalysisProgress,
  updateAnalysisProgress,
  updateFrameProgress,
  markAnalysisComplete,
  markAnalysisFailed,
  cleanupAnalysisProgress,
} from "./_core/firebase-realtime";


/**
 * 실시간 분석 진행률 추적 로직
 * Firestore Realtime Database를 활용한 실시간 업데이트
 */

interface AnalysisFrame {
  timestamp: number;
  description: string;
  modaptsCode: string;
  confidence: number;
}

/**
 * 비디오 분석 (진행률 추적 포함)
 */
export async function analyzeVideoWithProgress(
  projectId: string,
  userId: string,
  videoUrl: string,
  analysisPrompt: string
): Promise<any> {
  try {
    // 1. 진행률 초기화
    await initializeAnalysisProgress(projectId, userId, 4);

    // 2. 비디오 준비 단계
    await updateAnalysisProgress(projectId, {
      currentStep: 1,
      status: "preparing",
      percentage: 25,
      message: "비디오 준비 중...",
    });

    // 비디오 메타데이터 추출 (시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. Gemini API를 통한 분석
    await updateAnalysisProgress(projectId, {
      currentStep: 2,
      status: "analyzing",
      percentage: 50,
      message: "VLM 분석 중...",
    });

    // LLM 호출로 분석 수행
    const analysisResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `당신은 제조 현장의 동작 분석 전문가입니다. 
          MODAPTS (Modular Arrangement of Predetermined Time Standards) 코드를 사용하여 작업자의 동작을 분석합니다.
          각 동작에 대해 다음 정보를 제공하세요:
          - MODAPTS 코드 (M: 이동, G: 파악, P: 배치, A: 눈 초점, B: 신체 이동, F: 발 이동, S: 신체 회전)
          - 시간 (초 단위)
          - 신뢰도 (0-100)
          - 설명`,
        },
        {
          role: "user",
          content: `비디오 URL: ${videoUrl}\n\n분석 요청: ${analysisPrompt}\n\n이 비디오의 작업 동작을 분석하고 MODAPTS 코드를 부여해주세요.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "motion_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              frames: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    timestamp: { type: "number", description: "프레임 타임스탬프 (초)" },
                    description: { type: "string", description: "동작 설명" },
                    modaptsCode: { type: "string", description: "MODAPTS 코드" },
                    confidence: { type: "number", description: "신뢰도 (0-100)" },
                  },
                  required: ["timestamp", "description", "modaptsCode", "confidence"],
                },
              },
              totalDuration: { type: "number", description: "총 분석 시간 (초)" },
              summary: { type: "string", description: "분석 요약" },
            },
            required: ["frames", "totalDuration", "summary"],
            additionalProperties: false,
          },
        },
      },
    });

    // 4. 프레임 처리 진행률 업데이트
    const analysisData = JSON.parse(
      typeof analysisResponse.choices[0].message.content === "string"
        ? analysisResponse.choices[0].message.content
        : JSON.stringify(analysisResponse.choices[0].message.content)
    );
    const totalFrames = analysisData.frames.length;

    for (let i = 0; i < totalFrames; i++) {
      const frameRate = (i + 1) / ((totalFrames / 10) || 1); // 프레임/초 (시뮬레이션)
      await updateFrameProgress(projectId, i + 1, totalFrames, frameRate);

      // 프레임 처리 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 5. 분석 결과 처리
    await updateAnalysisProgress(projectId, {
      currentStep: 3,
      status: "processing",
      percentage: 75,
      message: "결과 처리 중...",
    });

    // 결과를 구조화된 형식으로 변환
    const processedFrames = analysisData.frames.map(
      (frame: AnalysisFrame, index: number) => ({
        sequenceNumber: index + 1,
        startTime: frame.timestamp.toString(),
        endTime: (frame.timestamp + 1).toString(), // 1초 간격으로 가정
        modaptsCode: frame.modaptsCode,
        modValue: extractModValue(frame.modaptsCode),
        timeSeconds: "1", // 1초 간격
        description: frame.description,
        confidence: frame.confidence.toString(),
        bodyPart: extractBodyPart(frame.modaptsCode),
      })
    );

    // 6. 분석 완료
    const result = {
      frames: processedFrames,
      totalDuration: analysisData.totalDuration,
      summary: analysisData.summary,
      totalMods: processedFrames.reduce((sum: number, f: any) => sum + f.modValue, 0),
      standardTime: calculateStandardTime(processedFrames),
    };

    await markAnalysisComplete(projectId, result);

    // 7. 진행률 정리 (1시간 후)
    cleanupAnalysisProgress(projectId, 3600000);

    return result;
  } catch (error) {
    console.error(`[Analysis] Error analyzing video for project ${projectId}:`, error);
    await markAnalysisFailed(projectId, error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

/**
 * MODAPTS 코드에서 MOD 값 추출
 */
function extractModValue(code: string): number {
  const modMap: Record<string, number> = {
    M0: 0,
    M1: 1,
    M2: 2,
    M3: 3,
    M4: 4,
    M5: 5,
    M6: 6,
    G0: 0,
    G1: 1,
    G2: 2,
    G3: 3,
    G4: 4,
    G5: 5,
    P0: 0,
    P1: 1,
    P2: 2,
    P3: 3,
    P4: 4,
    P5: 5,
    A0: 0,
    A1: 1,
    A2: 2,
    A3: 3,
    B0: 0,
    B1: 1,
    B2: 2,
    B3: 3,
    F0: 0,
    F1: 1,
    F2: 2,
    F3: 3,
    S0: 0,
    S1: 1,
    S2: 2,
    S3: 3,
  };

  return modMap[code] || 0;
}

/**
 * MODAPTS 코드에서 신체 부위 추출
 */
function extractBodyPart(code: string): string {
  const bodyPartMap: Record<string, string> = {
    M: "hand",
    G: "hand",
    P: "hand",
    A: "eye",
    B: "body",
    F: "foot",
    S: "body",
  };

  const firstChar = code.charAt(0);
  return bodyPartMap[firstChar] || "body";
}

/**
 * 표준시간 계산 (총 MOD 값 × 0.036초)
 */
function calculateStandardTime(frames: any[]): string {
  const totalMods = frames.reduce((sum, f) => sum + f.modValue, 0);
  const standardTime = totalMods * 0.036; // MODAPTS 표준: 1 MOD = 0.036초
  return standardTime.toFixed(2);
}

/**
 * 배치 분석 (여러 비디오 동시 분석)
 */
export async function analyzeBatchVideosWithProgress(
  userId: string,
  videos: Array<{
    projectId: string;
    videoUrl: string;
    analysisPrompt: string;
  }>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const video of videos) {
    try {
      results[video.projectId] = await analyzeVideoWithProgress(
        video.projectId,
        userId,
        video.videoUrl,
        video.analysisPrompt
      );
    } catch (error) {
      console.error(`[Analysis] Batch analysis failed for project ${video.projectId}:`, error);
      results[video.projectId] = {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return results;
}

export default {
  analyzeVideoWithProgress,
  analyzeBatchVideosWithProgress,
};
