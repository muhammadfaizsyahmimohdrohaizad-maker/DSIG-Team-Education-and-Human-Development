import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { reviewResume } from "@/server/llm/resume";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Gemini résumé provider", () => {
  it("requires configuration before sending text", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    await expect(reviewResume("Résumé", "Tester", ["Testing"])).rejects.toThrow("GEMINI_NOT_CONFIGURED");
    expect(request).not.toHaveBeenCalled();
  });
  it("sends the occupation and returns provider feedback", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-secret");
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{content: {parts: [{text: "Evidence: Built SQL reports."}]}}],
    })));
    vi.stubGlobal("fetch", request);
    await expect(reviewResume("Built SQL reports.", "Data analyst", ["SQL"])).resolves.toBe("Evidence: Built SQL reports.");
    const [url, options] = request.mock.calls[0]!;
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent");
    expect(JSON.parse(options.body).contents[0].parts[0].text).toContain("Data analyst");
    expect(options.headers["x-goog-api-key"]).toBe("test-secret");
  });
  it.each([401, 429, 503])("rejects provider status %s", async status => {
    vi.stubEnv("GEMINI_API_KEY", "test-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", {status})));
    await expect(reviewResume("Résumé", "Tester", [])).rejects.toThrow("GEMINI_STATUS_" + status);
  });
  it("rejects empty responses", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"choices":[]}')));
    await expect(reviewResume("Résumé", "Tester", [])).rejects.toThrow("GEMINI_INVALID_RESPONSE");
  });
});
