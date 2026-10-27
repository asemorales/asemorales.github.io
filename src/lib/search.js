// Matches the homepage search: every word of the query appears somewhere in
// the text, ignoring case and accents. An empty query matches everything.
export function fold(s) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function matcher(query) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return (text) => {
    const haystack = fold(text);
    return words.every((w) => haystack.includes(w));
  };
}
