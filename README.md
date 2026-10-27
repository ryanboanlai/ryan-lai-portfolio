# Ryan Lai · Portfolio

Personal portfolio for my engineering, programming, and community projects.

[View the live site](https://ryan-lai-portfolio.sillykrill10.chatgpt.site/) · [GitHub profile](https://github.com/ryanboanlai) · [LinkedIn](https://www.linkedin.com/in/ryanboanlai/)

## Features

- Responsive layouts for desktop and mobile.
- Project details in native HTML dialogs, with keyboard focus handling and Escape dismissal.
- Inline SVG project illustrations and a linked project navigation graphic.
- Email copying with visible success and failure messages.
- Visible keyboard focus styles and reduced-motion support.

## Stack

HTML, CSS, and JavaScript. No build step or package installation is required. The site loads Google Fonts over the network.

## Run locally

Clone the repository and serve its root directory with Python 3:

```sh
git clone https://github.com/ryanboanlai/ryan-lai-portfolio.git
cd ryan-lai-portfolio
python -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Stop the server with Ctrl+C.

## Source layout

- `index.html`: page content, inline illustrations, and project dialogs.
- `styles.css`: visual styles, responsive breakpoints, focus states, and reduced-motion rules.
- `app.js`: project dialog controls and email copying.
- `favicon.svg`: site icon.

The source is a snapshot of the existing public portfolio. Hosting is managed separately from this repository.
