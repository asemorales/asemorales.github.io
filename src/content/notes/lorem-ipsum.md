---
title: "Lorem Ipsum"
date: 2026-10-26
updated: 2026-10-27
tags: ["test"]
unlisted: true
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This first paragraph is the note's summary. It appears in popovers, in the feed, on the homepage, and in search, so it must stand alone. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, in the years 1991, 2025, and 2026.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. A second summary paragraph tests whether popovers show more than one paragraph. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

> [!status]
> This page exercises every design feature of the site. It is unlisted, so it stays off the homepage, the feed, and search. Edit it in Obsidian and run the sync to update the live page.

## Typography

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. This paragraph tests justification and hyphenation with long words: incomprehensibilities, electroencephalographically, and counterrevolutionaries. Numbers in prose: 0123456789, 3.14159, and 1,729. Headings use Source Serif 4, body text uses Inter, and tags and attributions use Source Serif small caps.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. This paragraph follows another paragraph, so its first line should be indented. Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit. Here is *italic*, **bold**, ***bold italic***, ~~strikethrough~~, `inline code`, and a very long unbreakable string that must not overflow the column on a phone: `https://example.com/a/very/long/path/that/keeps/going/and/going/without/any/spaces`.

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

Numbers in tables should be lining and tabular, so columns of digits align.

| Class | Example problem | Known inclusion | Year |
|---|---|---|---:|
| P | Primality testing | P ⊆ NP | 2002 |
| NP | Boolean satisfiability | NP ⊆ PSPACE | 1971 |
| PSPACE | True quantified Boolean formulas | PSPACE ⊆ EXPTIME | 1973 |
| EXPTIME | Generalized chess | EXPTIME ⊆ EXPSPACE | 1981 |

## Sidenotes

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.[^short] On wide screens each footnote sits in the right margin beside its reference. On phones a tap opens it below the paragraph.

Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.[^long] Vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.[^close] At vero eos et accusamus.[^math]

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.[^short] This sentence cites the first footnote a second time, which tests citation backlinks.

[^short]: A short sidenote.

[^long]: A long sidenote that runs for several lines, to test how notes stack when they are taller than the paragraph they annotate. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.

[^close]: A sidenote whose reference sits close to the previous one. It should be pushed down below the long note without overlapping it.

[^math]: A sidenote with math, $\mathsf{P} \subseteq \mathsf{NP}$, and a link to [the Wikipedia article on complexity classes](https://en.wikipedia.org/wiki/Complexity_class).

## Links

### Internal links

A wikilink to another section of this note: [[Lorem Ipsum#Typography]]. A wikilink with an alias: [[Lorem Ipsum#Math|the math section]]. A wikilink to a note that isn't published should render as plain text: [[Some Private Note]].

### External links

Each of these should show a text-only popover on hover.

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

Equation $\eqref{eq:halting}$ defines the diagonal halting set.

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

Syntax highlighting should follow the light and dark modes.

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

> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

### Attributed quote

> [!quote] Rodney Brooks, *Intelligence without Reason*, 1991
> Many lines of research have become goals of pursuit in their own right, with little recall of the reasons for pursuing those lines. A little grounding occasionally can go a long way towards helping keep things on track.

### Epigraph

> [!epigraph] Jorge Luis Borges, *The Library of Babel*
> There was no personal problem, no world problem, whose eloquent solution did not exist somewhere in some hexagon.

### Nested quotes

> The first level of quotation.
>
> > The second level, which should take a different background shade.
> >
> > > The third level, with a third shade.

### Long quote

> This quote runs past twelve lines, so it should collapse with only its first lines visible.
>
> Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
>
> Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
>
> Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
>
> Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.
>
> Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.

* * *

The line above is a section separator. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. The paragraph after a separator should not be indented.

## Infobox

> [!infobox] NP
> - **Full name:** Nondeterministic polynomial time
> - **Defined by:** Polynomial-time verifiers
> - **Complete problems:** SAT, 3-coloring, Hamiltonian path
> - **Contains:** P
> - **Contained in:** PSPACE

On wide screens the infobox sits in the right margin like a sidenote. On phones it sits in the column above this paragraph. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Headings

### A third-level heading

#### A fourth-level heading

Each heading should be numbered, listed in the table of contents, and linkable through an anchor that appears on hover.
