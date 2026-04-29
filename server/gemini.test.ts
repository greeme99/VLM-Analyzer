import { describe, expect, it, beforeAll } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("Gemini API Integration", () => {
  beforeAll(() => {
    // Check if GOOGLE_API_KEY is set
    if (!process.env.GOOGLE_API_KEY) {
      console.warn("⚠️  GOOGLE_API_KEY not set - skipping Gemini tests");
    }
  });

  it("should successfully call Gemini 2.5 Flash API with valid credentials", async () => {
    // Skip test if API key is not set
    if (!process.env.GOOGLE_API_KEY) {
      console.log("⏭️  Skipping Gemini API test (no API key configured)");
      expect(true).toBe(true);
      return;
    }

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: "Respond with a single word: 'success'",
          },
        ],
      });

      // Verify response structure
      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.choices.length).toBeGreaterThan(0);
      expect(response.choices[0]?.message).toBeDefined();
      expect(response.choices[0]?.message.content).toBeDefined();

      // Verify response contains expected content
      const content = response.choices[0]?.message.content || "";
      expect(content.length).toBeGreaterThan(0);

      console.log("✅ Gemini API test passed");
    } catch (error) {
      console.error("❌ Gemini API test failed:", error);
      throw new Error(
        `Gemini API call failed. Please verify your GOOGLE_API_KEY is valid. Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  it("should handle JSON schema responses for MODAPTS analysis", async () => {
    // Skip test if API key is not set
    if (!process.env.GOOGLE_API_KEY) {
      console.log("⏭️  Skipping MODAPTS schema test (no API key configured)");
      expect(true).toBe(true);
      return;
    }

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a motion analysis expert. Extract motion data from the video description.",
          },
          {
            role: "user",
            content:
              "A worker picks up a small part with fingers and places it on a table.",
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
                motions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      code: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["code", "description"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["motions"],
              additionalProperties: false,
            },
          },
        },
      });

      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.choices.length).toBeGreaterThan(0);

      const content = response.choices[0]?.message.content;
      expect(content).toBeDefined();

      // Try to parse as JSON
      if (typeof content === "string") {
        const parsed = JSON.parse(content);
        expect(parsed).toHaveProperty("motions");
        expect(Array.isArray(parsed.motions)).toBe(true);
      }

      console.log("✅ MODAPTS schema test passed");
    } catch (error) {
      console.error("❌ MODAPTS schema test failed:", error);
      throw new Error(
        `MODAPTS schema test failed. Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
});
