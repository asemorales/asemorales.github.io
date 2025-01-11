<div align="center">
    <img src="assets/images/logo.svg" alt="Site logo">
    <h1>Ase Morales - Full-stack Software Engineer</p></h1>
    <p>Personal portfolio site built with Jekyll + Tailwind CSS</p>
    <a href="https://irishmorales.github.io">View live site</a>
</div>

## Status

[![Deploy Jekyll + Tailwind CSS with GitHub Pages](https://github.com/IrishMorales/irishmorales.github.io/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/IrishMorales/irishmorales.github.io/actions/workflows/deploy.yml)

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

Since Jekyll requires some additional setup to work with Tailwind CSS, this site uses a custom deployment workflow seen in `deploy.yml`.

## Attribution

Assets used:

- Award icons by <a href="https://thenounproject.com/creator/imron46/" target="_blank" rel="noopener noreferrer">Cuputo</a> from the
  <a href="https://thenounproject.com/browse/icons/term/award/" target="_blank" rel="noopener noreferrer">Noun Project</a> (CC BY 3.0)
- All other icons by <a href="https://remixicon.com/" target="_blank" rel="noopener noreferrer">Remix Icon</a> (Apache License 2.0)

An homage to several works I love:

- <a href="https://marketplace.visualstudio.com/items?itemName=enkia.tokyo-night" target="_blank" rel="noopener noreferrer">Tokyo Night</a>
- <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer">Tailwind CSS</a>
- <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer">Supabase</a>
- <a href="https://vercel.com/geist/introduction" target="_blank" rel="noopener noreferrer">Geist</a>
- <a href="https://vercel.com/geist/introduction" target="_blank" rel="noopener noreferrer">Linear</a>
- the works of  <a href="https://brittanychiang.com/" target="_blank" rel="noopener noreferrer">Brittany Chiang</a>, <a href="https://www.jestsee.com/" target="_blank" rel="noopener noreferrer">Jesica</a>, and <a href="https://hen-ry.com/" target="_blank" rel="noopener noreferrer">Henry Ludlam-Steinke</a>
  

## Licensing

© 2024 Irish Danielle "Ase" Morales under AGPL 3.0
