import { describe, it, expect, beforeAll } from "vitest";
import { GeminiAnalyzer } from "./gemini_integration";

describe("Gemini Integration", () => {
  let analyzer: GeminiAnalyzer;
  const apiKey = process.env.GOOGLE_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set");
    }
    analyzer = new GeminiAnalyzer(apiKey);
  });

  it("should initialize Gemini analyzer with valid API key", () => {
    expect(analyzer).toBeDefined();
    expect(analyzer.model).toBe("gemini-2.5-flash");
  });

  it("should have correct base URL configured", () => {
    expect(analyzer.base_url).toBe("https://generativelanguage.googleapis.com/v1beta/models");
  });

  it("should create valid analysis prompt", () => {
    const motionEvents = [
      {
        sequence: 1,
        start_time: 0.0,
        end_time: 1.0,
        motion_type: "reach",
        body_part: "arm",
        distance: "medium",
      },
    ];

    const prompt = analyzer.create_analysis_prompt(motionEvents);
    
    expect(prompt).toBeDefined();
    expect(prompt).toContain("MODAPTS");
    expect(prompt).toContain("M1");
    expect(prompt).toContain("G0");
    expect(prompt).toContain("P0");
  });

  it("should parse valid JSON response", () => {
    const validResponse = `
    [
      {
        "sequence": 1,
        "start_time": 0.0,
        "end_time": 1.0,
        "code": "M3",
        "mod_value": 3,
        "time_seconds": 0.387,
        "description": "팔뚝을 부품으로 이동",
        "body_part": "arm",
        "confidence": 85
      }
    ]
    `;

    const parsed = analyzer.parse_sequence_response(validResponse);
    
    expect(parsed).toBeDefined();
    expect(Array.isArray(parsed)).toBe(true);
    if (parsed && parsed.length > 0) {
      expect(parsed[0].code).toBe("M3");
      expect(parsed[0].mod_value).toBe(3);
      expect(parsed[0].confidence).toBe(85);
    }
  });

  it("should handle invalid JSON response gracefully", () => {
    const invalidResponse = "This is not valid JSON";
    const parsed = analyzer.parse_sequence_response(invalidResponse);
    
    expect(parsed).toBeNull();
  });

  it("should select key frames correctly", () => {
    const frames = analyzer.select_key_frames(10, 5);
    
    expect(frames).toBeDefined();
    expect(frames.length).toBeLessThanOrEqual(5);
    expect(frames[0]).toBe(0);
  });
});
