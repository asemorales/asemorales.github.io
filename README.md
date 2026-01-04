<div align="center">
    <img src="assets/images/logo.svg" alt="Site logo">
    <p style="font-size: 3rem; font-weight: bold; margin-bottom: 0;">Ase Morales</p>
    <p style="font-size: 1.2rem; font-weight: semibold;">Research Software Engineer</p>
    <a href="https://asemorales.github.io">View site</a>
</div>

## Status

[![Deploy Jekyll + Tailwind CSS with GitHub Pages](https://github.com/asemorales/asemorales.github.io/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/asemorales/asemorales.github.io/actions/workflows/deploy.yml)

## Setup

Your system must have at least Ruby 3.1.x. Run the following:

1. `bundle install`
2. `npm install`

## Scripts

The build process is configured in `package.json` to 1.) process styles using PostCSS, using TailwindCSS as a PostCSS plugin; then 2.) build using
Jekyll into the files under `_site`.

#### Building for development

Run `npm run dev` or `npm run start`

This enables live reload, refreshing the page on any changes. Please note that changes to styles may reload the page twice, as
[live reloading both Jekyll & TailwindCSS may cause issues](https://github.com/tailwindlabs/tailwindcss/discussions/8470). If changes aren't
appearing, try manually serving the page instead or clearing the cache with `bundle exec jekyll clean` before serving.

#### Building for production

Run `npm run prod`

#### Deployment

Since Jekyll requires additional setup to work with Tailwind CSS, this site uses a custom deployment workflow seen in `deploy.yml`.

## Attribution

Assets used:

- Award icons by <a href="https://thenounproject.com/creator/imron46/" target="_blank" rel="noopener noreferrer">Cuputo</a> from the
  <a href="https://thenounproject.com/browse/icons/term/award/" target="_blank" rel="noopener noreferrer">Noun Project</a> (CC BY 3.0)
- All other icons by <a href="https://remixicon.com/" target="_blank" rel="noopener noreferrer">Remix Icon</a> (Apache License 2.0)

Visual & intellectual influences:

- <a href="https://barabasi.com/" target="_blank" rel="noopener noreferrer">Barabasi Lab</a>
- <a href="https://gwern.net/" target="_blank" rel="noopener noreferrer">Gwern</a>
- <a href="https://www.normalcomputing.com/" target="_blank" rel="noopener noreferrer">Normal Computing</a>
- <a href="https://distill.pub/" target="_blank" rel="noopener noreferrer">Distill.pub</a>
- <a href="https://andymatuschak.org/" target="_blank" rel="noopener noreferrer">Andy Matuschak (Works)</a>
- <a href="https://thinkingmachines.ai/" target="_blank" rel="noopener noreferrer">Thinking Machines Lab</a>

## Licensing

© 2024 Irish Danielle "Ase" Morales under AGPL 3.0
