import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sync, SyncError } from "../../scripts/sync.js";

const fixture = path.resolve("tests/fixtures/vault");
const fixedDate = () => ({ date: "2026-03-04", source: "git" });

let out;
beforeEach(async () => {
  out = await fs.mkdtemp(path.join(os.tmpdir(), "sync-out-"));
});
afterEach(async () => {
  await fs.rm(out, { recursive: true, force: true });
});

const read = (rel) => fs.readFile(path.join(out, rel), "utf8");

async function tempVault(notes) {
  const vault = await fs.mkdtemp(path.join(os.tmpdir(), "sync-vault-"));
  await fs.mkdir(path.join(vault, "published", "annotations"), { recursive: true });
  for (const [name, text] of Object.entries(notes)) await fs.writeFile(path.join(vault, "published", name), text);
  return vault;
}

describe("sync", () => {
  it("writes each note under its slug with generated front matter", async () => {
    await sync({ vault: fixture, out, lastUpdated: fixedDate });
    const note = await read("notes/halting-problem.md");
    expect(note.startsWith(`---\ntitle: "Halting Problem"\ndate: 2026-01-05\nupdated: 2026-03-04\ntags: ["computability","logic"]\n---\n\n`)).toBe(
      true,
    );
    expect(await read("notes/rices-theorem.md")).toContain("unlisted: true");
  });

  it("strips Obsidian comments outside code", async () => {
    await sync({ vault: fixture, out, lastUpdated: fixedDate });
    const note = await read("notes/halting-problem.md");
    expect(note).not.toContain("a private aside");
    expect(note).not.toContain("over several lines");
    expect(note).toContain("program stops. It links");
    expect(note).toContain("`%% kept %%`");
    expect(note).toContain("%% kept in code %%");
    expect(note).not.toMatch(/\n{3,}/);
  });

  it("copies embedded images and rewrites embeds to markdown images", async () => {
    const report = await sync({ vault: fixture, out, lastUpdated: fixedDate });
    const note = await read("notes/halting-problem.md");
    expect(note).toContain("![The diagonal argument](./images/diagram.png)");
    expect(note).toContain("![](./images/diagram.png)");
    expect(note).toContain("![[not-an-embed.png]]");
    await expect(fs.access(path.join(out, "notes/images/diagram.png"))).resolves.toBeUndefined();
    expect(report.images).toEqual([{ from: "attachments/diagram.png", to: "images/diagram.png" }]);
  });

  it("aliases wikilinks with their target's title and reports ones outside published/", async () => {
    const report = await sync({ vault: fixture, out, lastUpdated: fixedDate });
    expect(await read("notes/halting-problem.md")).toContain("[[rices-theorem|Rice’s Theorem]] and [[private-draft|a draft]]");
    expect(await read("notes/rices-theorem.md")).toContain("[[halting-problem#Proof|Halting Problem > Proof]]");
    expect(report.unresolved).toEqual([{ note: "published/halting-problem.md", target: "private-draft" }]);
  });

  it("links a note's own headings by anchor alone", async () => {
    const vault = await tempVault({ "note.md": "---\ntitle: Note\ndate: 2026-01-01\ntags: [a]\n---\n[[note#Part]] [[note]] [[#Part]]" });
    await sync({ vault, out, lastUpdated: fixedDate });
    expect(await read("notes/note.md")).toContain("[[#Part|Note > Part]] [[note|Note]] [[#Part]]");
    await fs.rm(vault, { recursive: true });
  });

  it("keeps special characters in the title", async () => {
    const vault = await tempVault({ "q-a.md": '---\ntitle: "Q&A: why/how?"\ndate: 2026-01-01\ntags: [a]\n---\nText.' });
    await sync({ vault, out, lastUpdated: fixedDate });
    expect(await read("notes/q-a.md")).toContain('title: "Q&A: why/how?"');
    await fs.rm(vault, { recursive: true });
  });

  it("copies annotations with their url", async () => {
    await sync({ vault: fixture, out, lastUpdated: fixedDate });
    expect(await read("annotations/gwern-design.md")).toBe(`---\nurl: "https://gwern.net/design"\n---\n\nHow gwern.net is designed, and why.\n`);
  });

  it("treats annotations as optional", async () => {
    const vault = await fs.mkdtemp(path.join(os.tmpdir(), "sync-vault-"));
    await fs.mkdir(path.join(vault, "published"));
    await fs.writeFile(path.join(vault, "published", "note.md"), "---\ntitle: Note\ndate: 2026-01-01\ntags: [logic]\n---\nText.");
    const report = await sync({ vault, out, lastUpdated: fixedDate });
    expect(report.annotations).toEqual([]);
    expect(await fs.readdir(path.join(out, "annotations"))).toEqual([".gitkeep"]);
  });

  it("removes notes that left published/", async () => {
    await fs.mkdir(path.join(out, "notes"), { recursive: true });
    await fs.writeFile(path.join(out, "notes", "old.md"), "stale");
    await sync({ vault: fixture, out, lastUpdated: fixedDate });
    await expect(fs.access(path.join(out, "notes", "old.md"))).rejects.toThrow();
  });

  it("falls back to the file's mtime outside git", async () => {
    const report = await sync({ vault: fixture, out, lastUpdated: () => null });
    expect(report.notes[0].updated.source).toBe("mtime");
    expect(report.notes[0].updated.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each([
    ["missing title", "---\ndate: 2026-01-01\ntags: [a]\n---\nText.", /missing "title"/],
    ["file name that isn't a slug", "---\ntitle: T\ndate: 2026-01-01\ntags: [a]\n---\nText.", /must look like "note.md"/, "Note.md"],
    ["missing date", "---\ntitle: T\ntags: [a]\n---\nText.", /missing "date"/],
    ["bad date", "---\ntitle: T\ndate: soon\ntags: [a]\n---\nText.", /"date" must be YYYY-MM-DD/],
    ["missing tags", "---\ntitle: T\ndate: 2026-01-01\n---\nText.", /"tags" must be a list/],
    ["nested tag", "---\ntitle: T\ndate: 2026-01-01\ntags: [a/b]\n---\nText.", /tags are flat/],
    ["unknown field", "---\ntitle: T\ndate: 2026-01-01\ntags: [a]\nstatus: draft\n---\nText.", /unknown front matter field "status"/],
    ["bad unlisted", "---\ntitle: T\ndate: 2026-01-01\ntags: [a]\nunlisted: yes please\n---\nText.", /"unlisted" must be true or false/],
    ["invalid YAML", "---\ntitle: T\ndate: [\n---\nText.", /not valid YAML/],
    ["note embed", "---\ntitle: T\ndate: 2026-01-01\ntags: [a]\n---\n![[Other Note]]", /embedding notes/],
    ["missing image", "---\ntitle: T\ndate: 2026-01-01\ntags: [a]\n---\n![[gone.png]]", /isn't anywhere in the vault/],
  ])("fails on %s and writes nothing", async (_, text, message, name) => {
    const vault = await tempVault({ [name ?? "note.md"]: text });
    const error = await sync({ vault, out, lastUpdated: fixedDate }).catch((e) => e);
    expect(error).toBeInstanceOf(SyncError);
    expect(error.message).toMatch(message);
    expect(await fs.readdir(out)).toEqual([]);
    await fs.rm(vault, { recursive: true });
  });

  it("fails on two notes with the same URL", async () => {
    const vault = await tempVault({ "a-b.md": "---\ntitle: A\ndate: 2026-01-01\ntags: [a]\n---\n" });
    await fs.mkdir(path.join(vault, "published", "sub"));
    await fs.writeFile(path.join(vault, "published", "sub", "a-b.md"), "---\ntitle: B\ndate: 2026-01-01\ntags: [a]\n---\n");
    await expect(sync({ vault, out, lastUpdated: fixedDate })).rejects.toThrow(/already taken/);
    await fs.rm(vault, { recursive: true });
  });

  it("fails on an annotation without a url", async () => {
    const vault = await tempVault({ "annotations/x.md": "---\nurl: ftp://x\n---\nText." });
    await expect(sync({ vault, out, lastUpdated: fixedDate })).rejects.toThrow(/needs a "url"/);
    await fs.rm(vault, { recursive: true });
  });

  it("fails when there is no published/ folder", async () => {
    await expect(sync({ vault: out, out })).rejects.toThrow(/no published\/ folder/);
  });
});
