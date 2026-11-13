---
title: "Colophon"
date: 2026-10-27
updated: 2026-10-27
tags: ["paratext"]
unlisted: true
---

This page includes details on the making of this site.

***

## Tools

Set in [Source Serif 4](https://github.com/adobe-fonts/source-serif) and [DM Mono](https://github.com/googlefonts/dm-mono). Pages are built with [Astro](https://astro.build/) and styled with [Tailwind CSS](https://tailwindcss.com/). Math is rendered with [MathJax](https://www.mathjax.org/) and code is highlighted with [Shiki](https://shiki.style/). This site is hosted on [GitHub Pages](https://pages.github.com/) with analytics from [Umami](https://umami.is/).

## Workflow

I write in [Obsidian](https://obsidian.md/) and use [Obsidian Sync](https://obsidian.md/sync) across my devices. I loosely follow [Steph Ango's](https://stephango.com/) [method for using Obsidian](https://stephango.com/vault), with several modifications based on my own preferences and for compatibility with this site.

I dedicate a folder for content to be published, which includes attachments, notes, and annotations for popovers on external links. I then run a custom `npm run sync` command to pull content from my vault to this site.

Styled components in notes, such as quotes, epigraphs, definitions, figure captions, and status boxes are written as callouts in Obsidian, then rendered by the site depending on the type of callout. Math and code blocks are rendered as is. Footnotes are rendered as either citations (if the footnote starts with `cite-`) or sidenotes (for all other cases). Highlights are rendered with pairs of == around text.

## Archiving external links

To account for [linkrot](https://en.wikipedia.org/wiki/Link_rot), [CI](https://en.wikipedia.org/wiki/Continuous_integration) is configured to archive new external links through the [Wayback Machine](https://web.archive.org/) and substitute dead links with archived copies.

## L-system garden

>[!quote]Fernando Pessoa, *[The Book of Disquiet](https://en.wikipedia.org/wiki/The_Book_of_Disquiet)*
>Since we cannot extract beauty from life, let us at least extract beauty from our inability to extract beauty from life. Let us make of our failure a victory, something proud and positive, complete with pillars, majesty and spiritual aquiescence.

I wanted to simulate a complex system in my site's footer, and at first I considered [cellular automata](https://en.wikipedia.org/wiki/Cellular_automaton). [D0L-systems](https://en.wikipedia.org/wiki/L-system) are fascinating[^2], but not complex systems. At best, they are an attempt to mimic the complexity of life.

I settled on L-systems for the simple reason that when I chose, I hadn't seen a single tree in a week. In my earliest writings long before I started this site, I would walk to universities because those were the only places you could find a forest in the whole city. It was there I sat under trees and lied on the grass and experienced such an amazement in the complexity of life, and there I would write.

The algorithms for the L-systems here are taken from [The Algorithmic Beauty of Plants](https://algorithmicbotany.org/papers/). A few details:
- Light attenuation based on Monsi–Saeki theory
- Plants wither, drop seeds/petals, and regrow over time
- Hover to rustle plants
- Tap to grow new plants[^1]

Wildlife is generated based on how often I wrote or updated a note in the past 30 days. This includes fireflies whose behavior syncs based on the [Kuromato model](https://en.wikipedia.org/wiki/Kuramoto_model), snails, birds, spiders, and caterpillars that transform into butterflies.

## Note graph

The graph on the homepage is inspired by the graph view in Obsidian, which displays notes and links between them. Notes are arranged by date of creation, with the earliest notes at the topmost and latest at the bottom. A few details:
- Layout is computed at build time (to render on browsers without JavaScript)
- Zoom with touchscreen gestures, `Ctrl+scroll`, or the `+` and `-` buttons on hover
- Display popovers and highlight note in contents on node hover

## Library

Items in the [[published/paratext/library|library]] are pulled from my [Open Library](https://openlibrary.org/)[^3] and [Readwise Reader](https://readwise.io/read) accounts. The status and tags of each item are stored in a note in my Obsidian vault. Book covers and descriptions are from Open Library. When missing, I try to add the details to Open Library rather than falling back to Google Books or other APIs as a way to enforce a system that includes open source contributions in my day-to-day life.

The algorithm for suggesting what I should read next is based on the following criteria. In descending priority:
1. Order of prerequisites
2. Spaced repetition
3. Interleaving topics with recently finished books
4. Non-interference with topics of books currently being read
5. Genre alternates between fiction and non-fiction
6. Books for which I have physical copies are spaced out to avoid digital fatigue

The library was created with a few goals:
1. Avoid [collector's fallacy](https://zettelkasten.de/posts/collectors-fallacy/) by forcing me to catch up on my backlog of saved items
2. Centralize my collection across my Open Library, Readwise, Substack, and physical library
3. Force myself to use a system that makes open source contributions part of my writing/reading routine[^4]

## Miscellaneous

Source code is available on [GitHub](https://github.com/asemorales/asemorales.github.io) under AGPL 3.0. My personal writing is available under CC BY-SA 4.0.

For a full list of this site's features, see [[lorem-ipsum|this page]].

[^1]: If the maximum allowed plants for your window size has already been reached, or if the plant would lack light to grow, an existing plant will wither to accommodate the new plant.

[^2]: And literal [digital gardens](https://www.eastgate.com/garden/Enter.html) :)

[^3]: I previously used Goodreads to keep track of my reading list, before eventually migrating my library to Open Library. I find that the recommender system for books on Open Library/Internet Archive seems to be better suited for historical, niche, and technical books compared to that of Goodreads. Goodreads tends to lean towards popular books and fiction, and thus recommendations seem to be more weighted by popularity, which is a disadvantage when seeking technical material. The Goodreads API to pull from a user's library has also been deprecated.

[^4]: There is a common adage that open source is driven by spite. Hence, I've decided I should take my frustration of missing book covers and descriptions to fuel open source. Others also do this by being angry at people or apps on the Internet, but I think that's too stressful for me. The Internet is a stressful place.
