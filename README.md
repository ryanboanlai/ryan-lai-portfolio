# Ryan Lai · Portfolio

Personal portfolio for my engineering, programming, and community projects.

[Visit the website](https://ryan-lai-portfolio.kimisui227.chatgpt.site/) · [GitHub profile](https://github.com/ryanboanlai) · [LinkedIn](https://www.linkedin.com/in/ryanboanlai/)

## Featured work

- **[ECHO RESCUE](https://ryan-lai-portfolio.kimisui227.chatgpt.site/#project-echo):** MadHacks 2026 team project connecting iPhone LiDAR scans to persistent room maps and browser-based room analysis. The feature includes a real scan image, team credit, and my contributions.
- **[ALGOGEM](https://ryan-lai-portfolio.kimisui227.chatgpt.site/#project-algogem):** Python auction bot developed during Jane Street AMP.
- **[Global Flu Tracker](https://ryan-lai-portfolio.kimisui227.chatgpt.site/#project-flu):** Team-built geospatial prototype, with my map and proximity-scoring contributions.
- **[Bridging the Gap](https://ryan-lai-portfolio.kimisui227.chatgpt.site/#project-bridge):** Books and STEM access project, with my proofreading and print-preparation work.

## Run locally

The site uses HTML, CSS, and JavaScript, with no build step or application dependencies. Serve this directory with Python 3:

```sh
git clone https://github.com/ryanboanlai/ryan-lai-portfolio.git
cd ryan-lai-portfolio
python -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://127.0.0.1:8000). Stop the server with Ctrl+C.

## Source

- `index.html`: page content, project illustrations, and native project dialogs.
- `styles.css`: responsive layouts, focus styles, and reduced-motion rules.
- `app.js`: dialog controls and email copying.
- `echosense-scan.webp`: optimized image from the team's final MadHacks scans.
- `social-preview.png`: sharing preview.
- `favicon.svg`: site icon.

Fonts load from Google Fonts. The [scan gallery](https://github.com/AkshathCodes/EchoSense/blob/0a906a2fe4a9dd1e73a4666b74363942c633c61a/docs/SCANS.md) documents the featured image and its limitations. Hosting is managed separately from this source repository.
