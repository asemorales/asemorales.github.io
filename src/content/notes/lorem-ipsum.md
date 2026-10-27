---
title: "Lorem Ipsum"
date: 2026-10-26
updated: 2026-10-27
tags: ["test"]
unlisted: true
---

This paragraph tests the note's summary. Popovers, the feed, the homepage, and search all show it, so it must make sense on its own. Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, in the years 1991, 2025, and 2026.

This paragraph tests whether popovers show more than one paragraph. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

> [!status]
> This page exercises every design feature of the site. It is unlisted, so it stays off the homepage, the feed, and search. Edit it in Obsidian and run the sync to update the live page.

## Typography

This paragraph tests line wrapping and hyphenation with long words: incomprehensibilities, electroencephalographically, and counterrevolutionaries. Numbers in prose: 0123456789, 3.14159, and 1,729. Headings and body text use [Source Serif 4](https://github.com/adobe-fonts/source-serif), and attributions use its small caps. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

This paragraph tests the first-line indent and the space between paragraphs. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

This paragraph tests inline styles and a long unbreakable string. Here is *italic*, **bold**, ***bold italic***, ~~strikethrough~~, `inline code`, and a long unbreakable string that must not overflow the column on a phone: `https://example.com/a/very/long/path/that/keeps/going/and/going/without/any/spaces`.

### Lists

This paragraph tests the lists below it: bullets, numbers, nesting, and a wrapped line. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.

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

This paragraph tests the table below it, whose numbers should be lining and tabular, so columns of digits align.

| Class | Example problem | Known inclusion | Year |
|---|---|---|---:|
| P | Primality testing | P ⊆ NP | 2002 |
| NP | Boolean satisfiability | NP ⊆ PSPACE | 1971 |
| PSPACE | True quantified Boolean formulas | PSPACE ⊆ EXPTIME | 1973 |
| EXPTIME | Generalized chess | EXPTIME ⊆ EXPSPACE | 1981 |

### Figures

![A dashed elliptical orbit with a planet and a star joined by a line](./images/orbit.svg)
*A figure in the column, with its caption from the italic line below the image. An orbit, drawn to no scale. The line marks the distance $r$ from the star.*

> [!wide]
> ![A timeline of four complexity results, from 1971 to 2002](./images/timeline.svg)
> *A wide figure, spanning the column and the right margin and clearing the sidenotes beside it. Four results from the table above, on a timeline.*

## Sidenotes

This paragraph tests a short sidenote.[^short] On wide screens each footnote sits in the right margin beside its reference. On phones, tapping the marker opens the note below the line.

This paragraph tests a long sidenote, one close behind it, and one with math.[^long] Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur. Vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.[^close] At vero eos et accusamus.[^math]

This paragraph tests a second reference to the first sidenote, which links back to its first citation.[^short] At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.

### Citations

This paragraph tests citations, which are footnotes whose body is a single link. Each gets a bracketed number in place of a letter, and its entry sits under References at the bottom.[^turing] Citing the same source again reuses its number.[^turing] A different source gets the next number.[^rice] A sidenote can cite a source too.[^cites]

[^short]: A short sidenote.

[^long]: A long sidenote that runs for several lines, to test how notes stack when they are taller than the paragraph they annotate. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.

[^close]: This note's reference sits close to the previous one, so the note should start below the long note and never overlap it.

[^math]: A sidenote with math, $\mathsf{P} \subseteq \mathsf{NP}$, and a link to [the Wikipedia article on complexity classes](https://en.wikipedia.org/wiki/Complexity_class).

[^cites]: Turing's paper is the source of the halting problem.[^turing]

[^turing]: [Turing 1936](https://doi.org/10.1112/plms/s2-42.1.230), §8.

[^rice]: [Rice 1953](https://doi.org/10.1090/S0002-9947-1953-0053041-6)

## Links

### Internal links

This paragraph tests wikilinks. One goes to another section of this note: [[Lorem Ipsum#Typography]]. A wikilink with an alias: [[Lorem Ipsum#Math|the math section]]. A wikilink to a note that isn't published should render as plain text: [[Some Private Note]].

### External links

This list tests the popover for each kind of external link. Every external link on the page that isn't a citation also appears under External links at the bottom, in order of first appearance, with a backlink to each place it appears.

- A GitHub repository: [asemorales/bierstadt](https://github.com/asemorales/bierstadt).
- An arXiv paper: [Attention Is All You Need](https://arxiv.org/abs/1706.03762).
- A DOI: [MobileLookNet](https://doi.org/10.1145/3663976.3664235).
- A Wikipedia article: [Halting problem](https://en.wikipedia.org/wiki/Halting_problem).
- A page with a hand-written annotation: [gwern.net design](https://gwern.net/design).
- A dead link, which should show the dead-link color and point to an archived copy: [a page that no longer exists](https://dead-link-test.invalid/page).

## Math

This paragraph tests inline math, which sits in the line: let $f : \mathbb{N} \to \mathbb{N}$ be total and computable, and let $\varphi_e$ be the $e$-th partial computable function.

This paragraph tests the numbered display equation below it.

$$
\begin{equation}
K = \{ e \in \mathbb{N} : \varphi_e(e)\!\downarrow \}
\label{eq:halting}
\end{equation}
$$

This paragraph tests a reference to that equation, whose number links to it. Equation $\eqref{eq:halting}$ defines the diagonal halting set, which is undecidable by the [halting problem](https://en.wikipedia.org/wiki/Halting_problem). This link repeats one from the list above, so its entry under External links should have two backlinks.

This paragraph tests a proof tree from `bussproofs`.

$$
\begin{prooftree}
\AxiomC{$\Gamma \vdash A$}
\AxiomC{$\Gamma \vdash A \to B$}
\RightLabel{$\to$E}
\BinaryInfC{$\Gamma \vdash B$}
\end{prooftree}
$$

This paragraph tests a commutative diagram from `amscd`.

$$
\begin{CD}
A @>f>> B \\
@VgVV @VVhV \\
C @>>k> D
\end{CD}
$$

## Code

This paragraph tests syntax highlighting, which should change with the light and dark rooms. The first block counts steps in the [Collatz sequence](https://en.wikipedia.org/wiki/Collatz_conjecture).

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

### Default quote

> This quote tests the default style, with no attribution. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

### Attributed quote

> [!quote] Jorge Luis Borges, *[The Library of Babel](https://en.wikipedia.org/wiki/The_Library_of_Babel)*
> There was no personal problem, no world problem, whose eloquent solution did not exist somewhere in some hexagon.

***

This paragraph tests the section separator above it. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Infobox

> [!infobox] NP
> - **Full name:** Nondeterministic polynomial time
> - **Defined by:** Polynomial-time verifiers
> - **See also:** [NP-completeness](https://en.wikipedia.org/wiki/NP-completeness)
> - **Complete problems:** SAT, 3-coloring, Hamiltonian path
> - **Contains:** P
> - **Contained in:** PSPACE

This paragraph tests the infobox above it. On wide screens the infobox sits in the right margin like a sidenote. On phones it sits in the column above this paragraph. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Headings

### A third-level heading

#### A fourth-level heading

This paragraph tests the headings above it. Each should have a number and an entry in the contents. Hovering over a heading shows a link icon, which copies a link to that section.
