import { describe, expect, it } from "vitest";
import { archiveAll, pending } from "../../scripts/archive-links.js";

// A stand-in for fetch that answers each request in turn and records them.
function server(...replies) {
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ url, init, body: Object.fromEntries(init.body) });
    const [status, json, headers = {}] = replies[requests.length - 1];
    return new Response(JSON.stringify(json), { status, headers });
  };
  return { fetch, requests };
}
const opts = (fetch) => ({ key: "k", secret: "s", today: "2026-10-27", fetch, pause: 0, log: () => {} });

describe("archive-links", () => {
  it("submits each linked URL once, in order", () => {
    expect(pending(["https://b.org", "https://a.org", "https://b.org", "https://c.org"], { "https://c.org": {} })).toEqual([
      "https://a.org",
      "https://b.org",
    ]);
  });

  it("authenticates, skips recent captures, and records accepted jobs", async () => {
    const { fetch, requests } = server([200, { job_id: "spn2-1" }], [200, { status: "error", message: "Couldn't resolve host." }]);
    const archived = {};
    expect(await archiveAll(["https://a.org", "https://gone.invalid"], archived, opts(fetch))).toBeNull();
    expect(archived).toEqual({ "https://a.org": { submitted: "2026-10-27", job: "spn2-1" } });
    expect(requests[0].url).toBe("https://web.archive.org/save");
    expect(requests[0].init.headers.Authorization).toBe("LOW k:s");
    expect(requests[0].init.headers["User-Agent"]).toContain("+https://asemorales.com");
    expect(requests[0].body).toMatchObject({ url: "https://a.org", if_not_archived_within: "30d" });
  });

  it("stops at a 429 and leaves the rest for the next run", async () => {
    const { fetch, requests } = server([200, { job_id: "j" }], [429, {}, { "Retry-After": "60" }]);
    const archived = {};
    const stopped = await archiveAll(["https://a.org", "https://b.org", "https://c.org"], archived, opts(fetch));
    expect(stopped).toBe("rate limited, retry after 60s; 2 left for the next run");
    expect(requests).toHaveLength(2);
    expect(Object.keys(archived)).toEqual(["https://a.org"]);
  });
});
