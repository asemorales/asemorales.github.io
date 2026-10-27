import { describe, expect, it } from "vitest";
import { failedUrls, linksIn, update } from "../../scripts/link-status.js";

describe("link status", () => {
  it("finds markdown links and autolinks", () => {
    expect(linksIn('[a](https://a.org/x) <https://b.org> [c](#local) [d](https://d.org "Title")')).toEqual([
      "https://a.org/x",
      "https://b.org",
      "https://d.org",
    ]);
  });

  it("reads failed URLs from lychee's fail_map or error_map", () => {
    expect(failedUrls({ fail_map: { "a.md": [{ url: "https://a.org" }] }, error_map: { "b.md": [{ url: "https://b.org" }] } })).toEqual(
      new Set(["https://a.org", "https://b.org"]),
    );
  });

  it("marks a link dead after two failed runs, revives it after a pass, and drops unlinked ones", () => {
    let status = update({}, ["https://a.org", "https://b.org"], new Set(["https://a.org"]), "2026-01-01");
    expect(status["https://a.org"]).toEqual({ firstSeen: "2026-01-01", failures: 1 });
    status = update(status, ["https://a.org", "https://b.org"], new Set(["https://a.org"]), "2026-01-08");
    expect(status["https://a.org"]).toEqual({ firstSeen: "2026-01-01", failures: 2, deadSince: "2026-01-08" });
    status = update(status, ["https://a.org", "https://b.org"], new Set(["https://a.org"]), "2026-01-15");
    expect(status["https://a.org"].deadSince).toBe("2026-01-08");
    status = update(status, ["https://a.org"], new Set(), "2026-01-22");
    expect(status).toEqual({ "https://a.org": { firstSeen: "2026-01-01", failures: 0 } });
  });
});
