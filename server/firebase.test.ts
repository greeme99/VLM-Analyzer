import { describe, it, expect, beforeAll } from "vitest";
import { ENV } from "./_core/env";

/**
 * Firebase Configuration Tests
 * Validates Firebase environment variables and configuration
 */
describe("Firebase Configuration", () => {
  it("should have Firebase project ID configured", () => {
    expect(ENV.firebaseProjectId).toBe("vlm-analyzer");
  });

  it("should have Firebase client email configured", () => {
    expect(ENV.firebaseClientEmail).toContain("firebase-adminsdk");
    expect(ENV.firebaseClientEmail).toContain("vlm-analyzer");
  });

  it("should have Firebase private key configured", () => {
    expect(ENV.firebasePrivateKey).toBeTruthy();
    expect(ENV.firebasePrivateKey).toContain("BEGIN PRIVATE KEY");
  });

  it("should have Firebase storage bucket configured", () => {
    expect(ENV.firebaseStorageBucket).toBe("vlm-analyzer.appspot.com");
  });

  it("should have Firebase database URL configured", () => {
    expect(ENV.firebaseDatabaseUrl).toContain("vlm-analyzer");
    expect(ENV.firebaseDatabaseUrl).toContain("firebaseio.com");
  });

  it("should have Firebase auth domain configured", () => {
    expect(ENV.firebaseAuthDomain).toBe("vlm-analyzer.firebaseapp.com");
  });

  it("should have Firebase web API key configured", () => {
    expect(ENV.firebaseWebApiKey).toBeTruthy();
    expect(ENV.firebaseWebApiKey.length).toBeGreaterThan(20);
  });

  it("should have all Firebase credentials non-empty", () => {
    const firebaseEnvs = [
      ENV.firebaseProjectId,
      ENV.firebasePrivateKeyId,
      ENV.firebasePrivateKey,
      ENV.firebaseClientEmail,
      ENV.firebaseClientId,
      ENV.firebaseAuthDomain,
      ENV.firebaseDatabaseUrl,
      ENV.firebaseStorageBucket,
      ENV.firebaseWebApiKey,
    ];

    firebaseEnvs.forEach((env) => {
      expect(env).toBeTruthy();
    });
  });

  it("should validate Firebase service account structure", () => {
    const serviceAccount = {
      projectId: ENV.firebaseProjectId,
      privateKeyId: ENV.firebasePrivateKeyId,
      privateKey: ENV.firebasePrivateKey,
      clientEmail: ENV.firebaseClientEmail,
      clientId: ENV.firebaseClientId,
    };

    expect(serviceAccount.projectId).toBe("vlm-analyzer");
    expect(serviceAccount.privateKeyId).toHaveLength(40); // SHA-1 hex string
    expect(serviceAccount.privateKey).toContain("BEGIN PRIVATE KEY");
    expect(serviceAccount.clientEmail).toMatch(/^firebase-adminsdk-/);
    expect(serviceAccount.clientId).toMatch(/^\d+$/);
  });

  it("should validate Firebase URLs format", () => {
    expect(ENV.firebaseAuthDomain).toMatch(/^[\w-]+\.firebaseapp\.com$/);
    expect(ENV.firebaseDatabaseUrl).toMatch(/^https:\/\/[\w-]+\.firebaseio\.com$/);
    expect(ENV.firebaseStorageBucket).toMatch(/^[\w-]+\.appspot\.com$/);
  });

  it("should have matching project IDs across Firebase configs", () => {
    expect(ENV.firebaseAuthDomain).toContain(ENV.firebaseProjectId);
    expect(ENV.firebaseDatabaseUrl).toContain(ENV.firebaseProjectId);
    expect(ENV.firebaseStorageBucket).toContain(ENV.firebaseProjectId);
  });
});
