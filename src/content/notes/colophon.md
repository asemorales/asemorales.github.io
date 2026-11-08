---
title: "Colophon"
date: 2026-10-27
updated: 2026-11-08
tags: ["paratext"]
unlisted: true
---

This page includes details on the making of this site.

***

## Tools

Set in [Source Serif 4](https://github.com/adobe-fonts/source-serif) and [DM Mono](https://github.com/googlefonts/dm-mono). Content is written in [Obsidian](https://obsidian.md/), built with [Astro](https://astro.build/), and styled with [Tailwind CSS](https://tailwindcss.com/). Math is rendered with [MathJax](https://www.mathjax.org/) and code is highlighted with [Shiki](https://shiki.style/). The site is hosted on [GitHub Pages](https://pages.github.com/) with analytics from [Umami](https://umami.is/).

## Workflow

I write in Obsidian and use [Obsidian Sync](https://obsidian.md/sync) across my devices[^3]. I dedicate a folder for content to be published, which includes attachments, notes, and annotations for popovers on external links. I then run a custom `npm run` command to pull content from my vault to my site.

Styled components in notes, such as quotes, epigraphs, definitions, figure captions, and status boxes are written as callouts in Obsidian, then rendered by the site depending on the type of callout. Math and code blocks are rendered as is. Footnotes are rendered as either citations (if the footnote starts with `cite-`) or sidenotes (for all other cases).

## Archiving external links

To account for [linkrot](https://en.wikipedia.org/wiki/Link_rot), [CI](https://en.wikipedia.org/wiki/Continuous_integration) is configured to archive new external links through the [Wayback Machine](https://web.archive.org/) and substitute dead links with archived copies.

## Digital garden

>[!quote]Fernando Pessoa, *[The Book of Disquiet](https://en.wikipedia.org/wiki/The_Book_of_Disquiet)*
>Since we cannot extract beauty from life, let us at least extract beauty from our inability to extract beauty from life. Let us make of our failure a victory, something proud and positive, complete with pillars, majesty and spiritual aquiescence.

I wanted to simulate a complex system in my site's footer, and at first I considered [cellular automata](https://en.wikipedia.org/wiki/Cellular_automaton). [D0L-systems](https://en.wikipedia.org/wiki/L-system) are fascinating[^2], but not complex systems. At best, they are an attempt to mimic the complexity of life.

I settled on L-systems for the simple reason that when I chose, I hadn't seen a single tree in a week. In my earliest writings long before I started this site, I would walk to universities because those were the only places you could find a forest in the whole city. It was there I sat under trees and lied on the grass and experienced such an amazement in the complexity of life, and there I would write.

The algorithms for the L-systems here are taken from [The Algorithmic Beauty of Plants](https://algorithmicbotany.org/papers/). A few details:
- Light attenuation based on Monsi–Saeki theory
- Plants wither, drop seeds/petals, and regrow over time
- Hover to rustle plants
- Tap to grow new plants[^1]

Wildlife is generated based on how often I wrote or updated a note in the past 30 days, where each note is one visitor. This includes fireflies whose behavior syncs based on the [Kuromato model](https://en.wikipedia.org/wiki/Kuramoto_model), snails, birds, spiders, and caterpillars that transform into butterflies.

## Source code and miscellaneous

For a list of all site elements, see the [[lorem-ipsum|feature test]]. Source code is available on [GitHub](https://github.com/asemorales/asemorales.github.io) under AGPL 3.0.

[^1]: If the maximum allowed plants for your window size has already been reached, or if the plant would lack light to grow, an existing plant will wither to accommodate the new plant.

[^2]: And literal [digital gardens](https://www.eastgate.com/garden/Enter.html) :)

[^3]: So I can be lazy and write on a phone in bed :)
