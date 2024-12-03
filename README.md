<div align="center">
    <img src="assets/favicon.ico?" alt="ase@create-with-<3 logo">
    <h1>ase@create-with-<3</h1>
    <p>Personal portfolio site designed in Figma & built with Jekyll + Tailwind CSS</p>
    <p>Live @ <a href="https://irishmorales.github.io" target="_blank" title="Open in new tab">irishmorales.github.io</a></p>
</div>

## Status

[![Deploy Jekyll + Tailwind CSS with GitHub Pages](https://github.com/IrishMorales/irishmorales.github.io/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/IrishMorales/irishmorales.github.io/actions/workflows/deploy.yml)

## Setup

Your system must have at least Ruby 3.1.x. Run the following:

1. `bundle install`
2. `npm install`

## Scripts

Since Jekyll requires some additional setup to work with Tailwind CSS, I configured scripts for building the site in `package.json` and created a custom deployment workflow for GitHub Actions. 

#### Building for development

Run `npm run dev` or `npm run start`

This is configured in `package.json` to simultaneously 1.) build using Jekyll into files under `_site`; and 2.) compile styles using TailwindCSS into `compiled.css`. Both are configured so that the page should refresh on any saved changes. However, [live reloading both Jekyll & TailwindCSS may sometimes cause issues](https://github.com/tailwindlabs/tailwindcss/discussions/8470); if changes aren't appearing, try manually serving the page instead or clearing the cache with `bundle exec jekyll clean` before serving.

#### Building for production

Run `npm run prod`

#### Deployment

See `deploy.yml` for the deployment workflow.

## Attribution

Assets used:

- Award by <a href="https://thenounproject.com/creator/imron46/" target="_blank" rel="noopener noreferrer">Cuputo</a> from <a href="https://thenounproject.com/browse/icons/term/award/" target="_blank" rel="noopener noreferrer">Noun Project</a> (CC BY 3.0)
- All other icons by <a href="https://remixicon.com/" target="_blank" rel="noopener noreferrer">Remix Icon</a> (Apache License 2.0)

A visual homage to several tools & works I love:

- <a href="https://marketplace.visualstudio.com/items?itemName=enkia.tokyo-night" target="_blank" rel="noopener noreferrer">Tokyo Night</a>
- <a href="https://anytype.io/" target="_blank" rel="noopener noreferrer">Anytype</a>
- <a href="https://css-tricks.com/" target="_blank" rel="noopener noreferrer">CSS Tricks</a>
- <a href="https://www.gitkraken.com/gitlens" target="_blank">GitLens</a>
- <a href="https://brittanychiang.com/" target="_blank" rel="noopener noreferrer">the works of Brittany Chiang</a>

## Licensing

This site is open source! You can use, modify, or distribute this site's code for your own site as long as your own site is also made open source (See AGPL 3.0).

I am where I am today because of countless people, resources, & opportunities that have helped me along the way. I have made this site open source because I deeply believe in open knowledge and social collaboration. If you’re using this site's code, please be a cool dude and respect this site's licensing (and consider contributing to open source). :)

© 2024 Irish Danielle "Ase" Morales licensed under AGPL 3.0
