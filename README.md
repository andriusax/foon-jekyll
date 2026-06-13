# FOON

Static website for the electro-acoustic duo Foon, built with [Jekyll](https://jekyllrb.com/).

## Run locally

```bash
bundle install        # first time only
bundle exec jekyll serve
```

Then open http://127.0.0.1:4000/.

## Project structure

```
_config.yml            Site configuration
_layouts/default.html  Shared page shell (header, nav, footer)
_data/
  shows.yml            Upcoming / past shows
  videos.yml           YouTube video list
index.html             Home
about.html
shows.html
releases.html
video.html
assets/
  css/main.css         Styles
  images/              Background images
icon.png, icon.svg     Favicons
```

## Editing content

| To change... | Edit |
|---|---|
| Header / nav / footer | `_layouts/default.html` |
| Home | `index.html` |
| About text | `about.html` |
| Shows list | `_data/shows.yml` |
| Releases | `releases.html` |
| Videos list | `_data/videos.yml` |
| Styles | `assets/css/main.css` |
| Site metadata | `_config.yml` |
