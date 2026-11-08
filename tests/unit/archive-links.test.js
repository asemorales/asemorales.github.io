import { describe, expect, it } from "vitest";
import { archiveAll, pending } from "../../scripts/archive-links.js";

function server(...replies) {
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ url, init, body: Object.fromEntries(init.body) });
    const [status, json, headers = {}] = replies[requests.length - 1];
    return new Response(JSON.stringify(json), { status, headers });
  };
  return { fetch, requests };
}
const opts = (fetch, waits = []) => ({
  key: "k",
  secret: "s",
  today: "2026-10-27",
  fetch,
  pause: 0,
  wait: async (ms) => waits.push(ms),
  log: () => {},
});

describe("archive-links", () => {
  it("submits each linked URL once, in order", () => {
    expect(pending(["https://b.org", "https://a.org", "https://b.org", "https://c.org"], { "https://c.org": {} })).toEqual([
      "https://a.org",
      "https://b.org",
    ]);
  });

  it("skips archive.org and .invalid links", () => {
    expect(
      pending(["https://archive.org/details/x", "https://web.archive.org/web/1/a", "https://gone.invalid/p", "https://notarchive.org"], {}),
    ).toEqual(["https://notarchive.org"]);
  });

  it("records links that already have a recent snapshot", async () => {
    const message = "The same snapshot had been made 231 hours, 2 minutes ago. You can make new capture of this URL after 720 hours.";
    const { fetch } = server([200, { status: "error", message }]);
    const archived = {};
    await archiveAll(["https://a.org"], archived, opts(fetch));
    expect(archived).toEqual({ "https://a.org": { submitted: "2026-10-27" } });
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

  it("waits after a 429 and retries the same link", async () => {
    const { fetch, requests } = server([429, {}, { "Retry-After": "300" }], [200, { job_id: "j" }]);
    const archived = {};
    const waits = [];
    expect(await archiveAll(["https://a.org"], archived, opts(fetch, waits))).toBeNull();
    expect(waits).toEqual([300000]);
    expect(requests.map((r) => r.body.url)).toEqual(["https://a.org", "https://a.org"]);
    expect(Object.keys(archived)).toEqual(["https://a.org"]);
  });

  it("stops after a second 429 and leaves the rest for the next run", async () => {
    const { fetch, requests } = server([200, { job_id: "j" }], [429, {}], [429, {}]);
    const archived = {};
    const waits = [];
    const stopped = await archiveAll(["https://a.org", "https://b.org", "https://c.org"], archived, opts(fetch, waits));
    expect(stopped).toBe("rate limited twice; 2 left for the next run");
    expect(waits).toEqual([0, 60000]);
    expect(requests).toHaveLength(3);
    expect(Object.keys(archived)).toEqual(["https://a.org"]);
  });

  it("stops on a network error and keeps earlier results", async () => {
    let calls = 0;
    const fetch = async () => {
      if (++calls === 1) return new Response(JSON.stringify({ job_id: "j" }));
      throw new TypeError("fetch failed", { cause: { code: "UND_ERR_CONNECT_TIMEOUT" } });
    };
    const archived = {};
    const stopped = await archiveAll(["https://a.org", "https://b.org", "https://c.org"], archived, opts(fetch));
    expect(stopped).toBe("UND_ERR_CONNECT_TIMEOUT; 2 left for the next run");
    expect(Object.keys(archived)).toEqual(["https://a.org"]);
  });
});
