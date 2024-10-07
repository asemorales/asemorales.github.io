<h1 align="center">irishmorales.github.io</h1>
<p align="center">Personal portfolio site designed in Figma & built with Jekyll</p>

### Setup

Run the following:

1. `bundle install`
2. `npm install`

### Starting the server

Run `npm run start`

This is configured in `package.json` to simultaneously 1.) build using Jekyll into files under `_site`; and 2.) compile styles using TailwindCSS into `assets/compiled.css`. Both are configured so that the page should refresh on any saved changes. However, [live reloading both Jekyll & TailwindCSS may sometimes cause issues](https://github.com/tailwindlabs/tailwindcss/discussions/8470); if changes aren't appearing, try manually serving the page instead or clearing the cache with `bundle exec jekyll clean` before serving.

Assets used:

- Font: Inter
- Award by Cuputo from <a href="https://thenounproject.com/browse/icons/term/award/" target="_blank" title="Award Icons">Noun Project</a> (CC BY 3.0)
- Sparkle by Oksana Latysheva from <a href="https://thenounproject.com/browse/icons/term/sparkle/" target="_blank" title="sparkle Icons">Noun Project</a> (CC BY 3.0)
- Sun & Moon by Artur Lopato from <a href="https://thenounproject.com/browse/icons/term/sun/" target="_blank" title="sun Icons">Noun Project</a> (CC BY 3.0)
