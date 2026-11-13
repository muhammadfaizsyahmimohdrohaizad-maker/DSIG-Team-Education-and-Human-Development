import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { reviewResume } from "@/server/llm/huggingface";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Hugging Face résumé provider", () => {
  it("requires configuration before sending text", async () => {
    vi.stubEnv("HF_TOKEN", "");
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    await expect(reviewResume("Résumé", "Tester", ["Testing"])).rejects.toThrow("HF_NOT_CONFIGURED");
    expect(request).not.toHaveBeenCalled();
  });
  it("sends the occupation and returns provider feedback", async () => {
    vi.stubEnv("HF_TOKEN", "test-secret");
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{message: {content: "Evidence: Built SQL reports."}}],
    })));
    vi.stubGlobal("fetch", request);
    await expect(reviewResume("Built SQL reports.", "Data analyst", ["SQL"])).resolves.toBe("Evidence: Built SQL reports.");
    const [url, options] = request.mock.calls[0]!;
    expect(url).toBe("https://router.huggingface.co/v1/chat/completions");
    expect(JSON.parse(options.body).messages[1].content).toContain("Data analyst");
    expect(options.headers.Authorization).toBe("Bearer test-secret");
  });
  it.each([401, 429, 503])("rejects provider status %s", async status => {
    vi.stubEnv("HF_TOKEN", "test-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", {status})));
    await expect(reviewResume("Résumé", "Tester", [])).rejects.toThrow("HF_STATUS_" + status);
  });
  it("rejects empty responses", async () => {
    vi.stubEnv("HF_TOKEN", "test-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"choices":[]}')));
    await expect(reviewResume("Résumé", "Tester", [])).rejects.toThrow("HF_INVALID_RESPONSE");
  });
});
