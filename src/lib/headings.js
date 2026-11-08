import GithubSlugger from "github-slugger";

export const BACK_IDS = ["see-also", "references", "external-links"];

export function headingSlugger() {
  const slugger = new GithubSlugger();
  for (const id of BACK_IDS) slugger.slug(id);
  return slugger;
}
