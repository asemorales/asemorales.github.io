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

The build process is configured in `package.json` to 1.) process styles using PostCSS, using TailwindCSS as a PostCSS plugin; then 2.) build using Jekyll into the files under `_site`.

#### Building for development

Run `npm run dev` or `npm run start`

This enables live reload, refreshing the page on any changes. Please note that changes to styles may reload the page twice, as [live reloading both Jekyll & TailwindCSS may cause issues](https://github.com/tailwindlabs/tailwindcss/discussions/8470). If changes aren't appearing, try manually serving the page instead or clearing the cache with `bundle exec jekyll clean` before serving.

#### Building for production

Run `npm run prod`

#### Deployment

Since Jekyll requires some additional setup to work with Tailwind CSS, this site uses a custom deployment workflow seen in `deploy.yml`.

## Attribution

Assets used:

- Award by <a href="https://thenounproject.com/creator/imron46/" target="_blank" rel="noopener noreferrer">Cuputo</a> from <a href="https://thenounproject.com/browse/icons/term/award/" target="_blank" rel="noopener noreferrer">Noun Project</a> (CC BY 3.0)
- Technology logo icons by <a href="https://simpleicons.org" target="_blank" rel="noopener noreferrer">Simple Icons</a> (Varying licenses). All logos are trademarks of their respective owners and used solely to demonstrate tech stack expertise. No affiliation, endorsement, or ownership is implied.
- All other icons by <a href="https://remixicon.com/" target="_blank" rel="noopener noreferrer">Remix Icon</a> (Apache License 2.0)

A visual homage to several tools & works I love:

- <a href="https://marketplace.visualstudio.com/items?itemName=enkia.tokyo-night" target="_blank" rel="noopener noreferrer">Tokyo Night</a>
- <a href="https://css-tricks.com/" target="_blank" rel="noopener noreferrer">CSS Tricks</a>
- <a href="https://www.gitkraken.com/gitlens" target="_blank">GitLens</a>
- <a href="https://brittanychiang.com/" target="_blank" rel="noopener noreferrer">the works of Brittany Chiang</a>

## Licensing

<b>This site is open source!</b> You can use, modify, or distribute this site's code for your own site as long as your own site is also made open source (See AGPL 3.0).

I am where I am today because of countless people, resources, & opportunities that have helped me along the way. I have made this site open source because I deeply believe in open knowledge and social collaboration. If you’re using this site's code, please be a cool dude and respect this site's licensing (and consider contributing to open source). :)

© 2024 Irish Danielle "Ase" Morales under AGPL 3.0
