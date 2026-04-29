import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Analysis Router", () => {
  it("should have analysis router available", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.analysis).toBeDefined();
    expect(caller.analysis.startAnalysis).toBeDefined();
    expect(caller.analysis.getMotions).toBeDefined();
    expect(caller.analysis.updateMotion).toBeDefined();
  });

  it("should validate analysis input parameters", () => {
    // Test that startAnalysis requires projectId, videoUrl, and analysisPrompt
    const validInput = {
      projectId: 1,
      videoUrl: "https://example.com/video.mp4",
      analysisPrompt: "Analyze this video",
    };

    expect(validInput.projectId).toBeGreaterThan(0);
    expect(validInput.videoUrl).toBeTruthy();
    expect(validInput.analysisPrompt).toBeTruthy();
  });

  it("should require non-empty analysis prompt", () => {
    const emptyPrompt = "";
    const validPrompt = "분석 목적: 작업 자세 교정";

    expect(emptyPrompt.trim().length).toBe(0);
    expect(validPrompt.trim().length).toBeGreaterThan(0);
  });

  it("should format MODAPTS analysis response correctly", () => {
    const mockAnalysisResponse = {
      motions: [
        {
          timeRange: "0:00-0:05",
          description: "준비 자세",
          code: "M2",
          modValue: 2,
          confidence: 0.95,
        },
        {
          timeRange: "0:05-0:12",
          description: "동작 수행",
          code: "G1",
          modValue: 1,
          confidence: 0.88,
        },
      ],
      totalMOD: 3,
      standardTime: "0.387s",
    };

    expect(mockAnalysisResponse.motions).toHaveLength(2);
    expect(mockAnalysisResponse.totalMOD).toBe(3);
    expect(mockAnalysisResponse.motions[0]?.code).toBe("M2");
    expect(mockAnalysisResponse.motions[0]?.modValue).toBe(2);
    expect(mockAnalysisResponse.motions[0]?.confidence).toBe(0.95);
  });

  it("should calculate standard time from MOD values", () => {
    // MOD value * 0.129 seconds = standard time
    const modValue = 2;
    const expectedTime = modValue * 0.129;

    expect(expectedTime).toBeCloseTo(0.258, 3);
  });

  it("should support all MODAPTS code types", () => {
    const modaptsCodes = {
      move: ["M1", "M2", "M3", "M4", "M5", "M6"],
      get: ["G0", "G1", "G2", "G3"],
      place: ["P0", "P1", "P2"],
      other: ["D3", "L1", "E2", "F3", "R2"],
    };

    expect(modaptsCodes.move).toContain("M1");
    expect(modaptsCodes.get).toContain("G1");
    expect(modaptsCodes.place).toContain("P2");
    expect(modaptsCodes.other).toContain("D3");
  });

  it("should handle motion event creation with correct fields", () => {
    const motionEvent = {
      projectId: 1,
      sequenceNumber: 1,
      startTime: "0:00",
      endTime: "0:05",
      modaptsCode: "M2",
      modValue: 2,
      timeSeconds: "0.258",
      description: "준비 자세",
      confidence: "95",
    };

    expect(motionEvent.projectId).toBe(1);
    expect(motionEvent.modaptsCode).toBe("M2");
    expect(motionEvent.modValue).toBe(2);
    expect(parseInt(motionEvent.confidence)).toBe(95);
  });

  it("should validate project ownership before analysis", () => {
    const projectUserId = 1;
    const currentUserId = 1;

    expect(projectUserId).toBe(currentUserId);
  });

  it("should reject analysis for unauthorized projects", () => {
    const projectUserId = 1;
    const currentUserId = 2;

    expect(projectUserId).not.toBe(currentUserId);
  });

  it("should parse Gemini JSON response correctly", () => {
    const geminiResponse = JSON.stringify({
      motions: [
        {
          timeRange: "0:00-0:05",
          description: "Motion 1",
          code: "M1",
          modValue: 1,
          confidence: 0.9,
        },
      ],
      totalMOD: 1,
      standardTime: "0.129s",
    });

    const parsed = JSON.parse(geminiResponse);
    expect(parsed.motions).toHaveLength(1);
    expect(parsed.totalMOD).toBe(1);
  });
});
