---
title: "Lorem Ipsum"
date: 2026-10-26
updated: 2026-10-27
tags: ["test"]
unlisted: true
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This first paragraph is the note's summary. Popovers, the feed, the homepage, and search all show it, so it must make sense on its own. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, in the years 1991, 2025, and 2026.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. This second paragraph tests whether popovers show more than one paragraph. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

> [!status]
> This page exercises every design feature of the site. It is unlisted, so it stays off the homepage, the feed, and search. Edit it in Obsidian and run the sync to update the live page.

## Typography

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. This paragraph tests justification and hyphenation with long words: incomprehensibilities, electroencephalographically, and counterrevolutionaries. Numbers in prose: 0123456789, 3.14159, and 1,729. Headings and body text use [Source Serif 4](https://github.com/adobe-fonts/source-serif), and attributions use its small caps.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. This paragraph follows another one, so its first line should be indented. Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit. Here is *italic*, **bold**, ***bold italic***, ~~strikethrough~~, `inline code`, and a long unbreakable string that must not overflow the column on a phone: `https://example.com/a/very/long/path/that/keeps/going/and/going/without/any/spaces`.

### Lists

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.

- An unordered item.
- An item with a nested list:
  - A nested item.
  - Another nested item with a longer line of text that wraps onto a second line on narrow screens.
- A final item.

1. An ordered item.
2. A second item.
   1. A nested ordered item.
3. A third item.

### Tables

Numbers in tables should be lining and tabular, so columns of digits align. The [Complexity Zoo](https://complexityzoo.net/Complexity_Zoo) lists hundreds more classes.

| Class | Example problem | Known inclusion | Year |
|---|---|---|---:|
| P | Primality testing | P ⊆ NP | 2002 |
| NP | Boolean satisfiability | NP ⊆ PSPACE | 1971 |
| PSPACE | True quantified Boolean formulas | PSPACE ⊆ EXPTIME | 1973 |
| EXPTIME | Generalized chess | EXPTIME ⊆ EXPSPACE | 1981 |

### Figures

An image alone in its paragraph becomes a figure in the column, here with no caption.

![A dashed elliptical orbit with a planet and a star joined by a line](./images/orbit.svg)

An italic line right below the image becomes its caption.

![A dashed elliptical orbit with a planet and a star joined by a line](./images/orbit.svg)
*An orbit, drawn to no scale. The line marks the distance $r$ from the star.*

A wide callout spans the column and the right margin, here with a caption.

> [!wide]
> ![A timeline of four complexity results, from 1971 to 2002](./images/timeline.svg)
> *Four results from the table above, on a timeline. Wide figures clear the sidenotes beside them.*

And a wide figure with no caption.

> [!wide]
> ![A timeline of four complexity results, from 1971 to 2002](./images/timeline.svg)

## Sidenotes

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.[^short] On wide screens each footnote sits in the right margin beside its reference. On phones, tapping the number opens the note below the line.

Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.[^long] Vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.[^close] At vero eos et accusamus.[^math]

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.[^short] This sentence cites the first footnote again, to test the link back to its first citation.

[^short]: A short sidenote.

[^long]: A long sidenote that runs for several lines, to test how notes stack when they are taller than the paragraph they annotate. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.

[^close]: This note's reference sits close to the previous one, so the note should start below the long note and never overlap it.

[^math]: A sidenote with math, $\mathsf{P} \subseteq \mathsf{NP}$, and a link to [the Wikipedia article on complexity classes](https://en.wikipedia.org/wiki/Complexity_class).

## Links

### Internal links

A wikilink to another section of this note: [[Lorem Ipsum#Typography]]. A wikilink with an alias: [[Lorem Ipsum#Math|the math section]]. A wikilink to a note that isn't published should render as plain text: [[Some Private Note]].

### External links

Each of these should show a text-only popover on hover. Every external link on the page also appears in the bibliography at the bottom, in order of first appearance, with a backlink to each place it is cited.

- A GitHub repository: [asemorales/bierstadt](https://github.com/asemorales/bierstadt).
- An arXiv paper: [Attention Is All You Need](https://arxiv.org/abs/1706.03762).
- A DOI: [MobileLookNet](https://doi.org/10.1145/3663976.3664235).
- A Wikipedia article: [Halting problem](https://en.wikipedia.org/wiki/Halting_problem).
- A page with a hand-written annotation: [gwern.net design](https://gwern.net/design).
- A dead link, which should show the dead-link color and point to an archived copy: [a page that no longer exists](https://dead-link-test.invalid/page).

## Math

Inline math sits in the line: let $f : \mathbb{N} \to \mathbb{N}$ be total and computable, and let $\varphi_e$ be the $e$-th partial computable function.

Display math, numbered and referenced:

$$
\begin{equation}
K = \{ e \in \mathbb{N} : \varphi_e(e)\!\downarrow \}
\label{eq:halting}
\end{equation}
$$

Equation $\eqref{eq:halting}$ defines the diagonal halting set, which is undecidable by the [halting problem](https://en.wikipedia.org/wiki/Halting_problem). This link repeats one from the list above, so its bibliography entry should have two backlinks.

A proof tree:

$$
\begin{prooftree}
\AxiomC{$\Gamma \vdash A$}
\AxiomC{$\Gamma \vdash A \to B$}
\RightLabel{$\to$E}
\BinaryInfC{$\Gamma \vdash B$}
\end{prooftree}
$$

A commutative diagram:

$$
\begin{CD}
A @>f>> B \\
@VgVV @VVhV \\
C @>>k> D
\end{CD}
$$

## Code

Syntax highlighting should change with the light and dark rooms. The first block counts steps in the [Collatz sequence](https://en.wikipedia.org/wiki/Collatz_conjecture).

```python
def collatz_steps(n: int) -> int:
    """Count steps until n reaches 1."""
    steps = 0
    while n != 1:
        n = n // 2 if n % 2 == 0 else 3 * n + 1
        steps += 1
    return steps
```

```haskell
fix :: (a -> a) -> a
fix f = let x = f x in x
```

```sh
npm run sync && git push
```

## Quotes

### Plain quote

> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

### Epigraph

> [!epigraph] Jorge Luis Borges, *[The Library of Babel](https://en.wikipedia.org/wiki/The_Library_of_Babel)*
> There was no personal problem, no world problem, whose eloquent solution did not exist somewhere in some hexagon.

***

The line above is a section separator. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. This paragraph follows a separator, so its first line should not be indented.

## Infobox

> [!infobox] NP
> - **Full name:** Nondeterministic polynomial time
> - **Defined by:** Polynomial-time verifiers
> - **See also:** [NP on the Complexity Zoo](https://complexityzoo.net/Complexity_Zoo:N#np)
> - **Complete problems:** SAT, 3-coloring, Hamiltonian path
> - **Contains:** P
> - **Contained in:** PSPACE

On wide screens the infobox sits in the right margin like a sidenote. On phones it sits in the column above this paragraph. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Headings

### A third-level heading

#### A fourth-level heading

Each heading should have a number and an entry in the contents. Hovering over a heading shows a link icon, which copies a link to that section.
