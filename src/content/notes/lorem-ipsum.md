---
title: "Lorem Ipsum"
date: 2026-10-26
updated: 2026-11-04
tags: ["test"]
---

This page contains dummy text used to test the design features of this site. Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, in the years 1991, 2025, and 2026.

> [!status]
> Ase is a human and may make mistakes.

## Typography

Incomprehensibilities, electroencephalographically, and counterrevolutionaries. 0123456789, 3.14159, and 1,729. Set in [Source Serif 4](https://github.com/adobe-fonts/source-serif).

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.

This paragraph tests the uneven ink, which should look faintly blotchy only under close inspection. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

*Italic*, **bold**, ***bold italic***, ~~strikethrough~~, `inline code`, and `https://example.com/a/very/long/path/that/keeps/going/and/going/without/any/spaces`.

### Lists

- An unordered item.
- An item with a nested list:
  - A nested item.
  - Another nested item with a longer line of text that wraps onto a second line on narrow screens.
- A final item.

1. An ordered item.
2. A second item.
   - A nested item.
   - Another nested item with a longer line of text that wraps onto a second line on narrow screens.
3. A third item.

### Tables

| Class | Example problem | Known inclusion | Year |
|---|---|---|---:|
| P | Primality testing | P ⊆ NP | 2002 |
| NP | Boolean satisfiability | NP ⊆ PSPACE | 1971 |
| PSPACE | True quantified Boolean formulas | PSPACE ⊆ EXPTIME | 1973 |
| EXPTIME | Generalized chess | EXPTIME ⊆ EXPSPACE | 1981 |

### Figures

![A dashed elliptical orbit with a planet and a star joined by a line](./images/orbit.svg)
*An orbit, drawn to no scale. The line marks the distance $r$ from the star.*

> [!wide]
> ![A timeline of four complexity results, from 1971 to 2002](./images/timeline.svg)
> *Four results from the table above, on a timeline.*

## Sidenotes

Lorem ipsum dolor sit amet.[^short]

Quis autem vel eum iure reprehenderit.[^long] Vel illum qui dolorem eum fugiat.[^close] At vero eos et accusamus.[^math]

At vero eos et accusamus et iusto odio dignissimos.[^short]

This paragraph tests quotes in sidenotes, with the quote's lines indented and unindented. Nam libero tempore.[^quote] Cum soluta nobis est eligendi optio.[^flat-quote]

This paragraph tests a status notice and an infobox in sidenotes. Temporibus autem quibusdam.[^status-note] Itaque earum rerum hic tenetur.[^infobox-note]

This paragraph tests a footnote that is only a link, which stays a sidenote without the `cite-` prefix. Et harum quidem rerum facilis.[^link-only]

### Citations

This paragraph tests citations, with a repeated source, a formatted locator, and a citation inside a sidenote. Lorem ipsum dolor sit amet.[^cite-turing] Consectetur adipiscing elit.[^cite-turing] Sed do eiusmod tempor.[^cite-rice] Ut labore et dolore.[^cites]

This paragraph tests a citation without a link, which appears in the references as text. Quis nostrud exercitation.[^cite-hofstadter]

[^short]: A short sidenote.

[^long]: A long sidenote. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.

[^close]: A sidenote close behind the long one.

[^math]: A sidenote with math, $\mathsf{P} \subseteq \mathsf{NP}$, and a link to [the Wikipedia article on complexity classes](https://en.wikipedia.org/wiki/Complexity_class).

[^quote]: > [!quote] Jorge Luis Borges, *[The Library of Babel](https://en.wikipedia.org/wiki/The_Library_of_Babel)*
    > An indented quote in a sidenote.

[^flat-quote]: > [!quote] Jorge Luis Borges, *[The Library of Babel](https://en.wikipedia.org/wiki/The_Library_of_Babel)*
> An unindented quote in a sidenote.

[^status-note]: > [!status]
    > A status notice in a sidenote.

[^infobox-note]: > [!infobox] P
> - **Full name:** Polynomial time
> - **Contained in:** NP

[^link-only]: [gwern.net design](https://gwern.net/design)

[^cites]: A sidenote with a citation.[^cite-turing]

[^cite-turing]: [Turing 1936](https://doi.org/10.1112/plms/s2-42.1.230), §8.

[^cite-rice]: [Rice 1953](https://doi.org/10.1090/S0002-9947-1953-0053041-6), *Lorem ipsum*, p. 358.

[^cite-hofstadter]: Hofstadter, 1979, *Gödel, Escher, Bach*.

## Links

### Internal links

A section of this note: [[#Typography|Lorem Ipsum > Typography]]. An alias: [[#Math|the math section]]. A note whose title has punctuation and whose popover shows an epigraph: [[dolor-sit-amet|Dolor Sit Amet :"><,.?/+-~`]]. An unpublished note, as plain text: [[Some Private Note]].

This paragraph tests popovers on glossary terms. Lorem ipsum [[glossary#entelechy (noun)|entelechy]]. An alias: [[glossary#entelechy (noun)|entelechia]].

### External links

- A GitHub repository: [asemorales/bierstadt](https://github.com/asemorales/bierstadt).
- An arXiv paper: [Attention Is All You Need](https://arxiv.org/abs/1706.03762).
- A DOI: [MobileLookNet](https://doi.org/10.1145/3663976.3664235).
- A Wikipedia article: [Halting problem](https://en.wikipedia.org/wiki/Halting_problem).
- The same article again: [the halting problem](https://en.wikipedia.org/wiki/Halting_problem).
- A page with a hand-written annotation: [gwern.net design](https://gwern.net/design).
- A page with no annotation, which previews its first paragraph: [Tufte CSS](https://edwardtufte.github.io/tufte-css/).
- A dead link: [a page that no longer exists](https://dead-link-test.invalid/page).

## Math

Let $f : \mathbb{N} \to \mathbb{N}$ be total and computable, and let $\varphi_e$ be the $e$-th partial computable function.

$$
\begin{equation}
K = \{ e \in \mathbb{N} : \varphi_e(e)\!\downarrow \}
\label{eq:halting}
\end{equation}
$$

Equation $\eqref{eq:halting}$ defines the diagonal halting set.

$$
\begin{prooftree}
\AxiomC{$\Gamma \vdash A$}
\AxiomC{$\Gamma \vdash A \to B$}
\RightLabel{$\to$E}
\BinaryInfC{$\Gamma \vdash B$}
\end{prooftree}
$$

$$
\begin{CD}
A @>f>> B \\
@VgVV @VVhV \\
C @>>k> D
\end{CD}
$$

## Code

This section tests every Shiki token color. The Python block shows imports, comments, keywords, functions, types, strings, escapes, and constants.

```python
from dataclasses import dataclass  # imports are teal

@dataclass
class Collatz:
    """Count steps until n reaches 1."""

    limit: int = 1_000

    def steps(self, n: int) -> int | None:
        count = 0
        while n != 1 and count < self.limit:
            n = n // 2 if n % 2 == 0 else 3 * n + 1
            count += 1
        print(f"{n=}\t{count}")
        return count if n == 1 else None
```

This diff tests inserted, deleted, and range colors.

```diff
@@ -1,3 +1,3 @@
 def collatz_steps(n: int) -> int:
-    steps = 0
+    count = 0
```

This Markdown block tests headings, markup, links, inline code, and quotes.

```md
# Heading

**Bold**, *italic*, ~~struck~~, and `inline code`.

- [A link](https://example.com)

> A quote.
```

```sh
npm run sync && git push
```

## Quotes

### Default quote

> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Epigraph

> [!quote] Jorge Luis Borges, *[The Library of Babel](https://en.wikipedia.org/wiki/The_Library_of_Babel)*
> There was no personal problem, no world problem, whose eloquent solution did not exist somewhere in some hexagon.

### Separator

***

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Infobox

> [!infobox] NP
> - **Full name:** Nondeterministic polynomial time
> - **Defined by:** Polynomial-time verifiers
> - **See also:** [NP-completeness](https://en.wikipedia.org/wiki/NP-completeness)
> - **Complete problems:** SAT, 3-coloring, Hamiltonian path
> - **Contains:** P
> - **Contained in:** PSPACE

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Headings

### A third-level heading

#### A fourth-level heading

## Reading

This page's length tests the scroll-depth events, which fire as the reader passes 25%, 50%, 75%, and 90% of the prose. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

This page's length also tests the L-systems at the foot of the page. On load, three or four fully grown plants appear on wide screens, and one or two on phones. New plants grow only while the bottom of the screen is past 90% of the page. One to three grow at a time and start one to three seconds apart. When one finishes, the next starts, up to 20 plants on wide screens and 10 on phones. Each plant is a tree, a fern, or a flowering stalk. Trees are 150 to 216 pixels tall, ferns are 80 to 135, and flowers are 50 to 110, so every tree is taller than every fern and flower. Wide screens show at most eight trees, and phones show at most three. Ferns and flowers make up the rest of the plants. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

> [!colophon] Colophon
> Finished, thank God.
