# Ryan Lai · Portfolio

Personal portfolio for my engineering, programming, and community projects.

[Visit the website](https://ryan-lai-portfolio.kimisui227.chatgpt.site/) · [GitHub profile](https://github.com/ryanboanlai) · [LinkedIn](https://www.linkedin.com/in/ryanboanlai/)

## Featured work

- **[ECHO RESCUE](https://ryan-lai-portfolio.kimisui227.chatgpt.site/#project-echo):** MadHacks 2026 team project connecting iPhone LiDAR scans to persistent room maps and browser-based room analysis. The case study includes an enlarged recorded scan, the team pipeline, design choices, and my contributions.
- **[ALGOGEM](https://ryan-lai-portfolio.kimisui227.chatgpt.site/#project-algogem):** Python auction bot developed during Jane Street AMP.
- **[Global Flu Tracker](https://ryan-lai-portfolio.kimisui227.chatgpt.site/#project-flu):** Team-built geospatial prototype, with my map and proximity-scoring contributions.
- **[Bridging the Gap](https://ryan-lai-portfolio.kimisui227.chatgpt.site/#project-bridge):** Books and STEM access project, with my proofreading and print-preparation work. [Wisconsin DPI team profile](https://dpi.wi.gov/news/dpi-connected/ashwaubenon-students-hope-bridge-gap-global-outreach-project) · [Public campaign](https://www.gofundme.com/f/Books-and-STEM-Kits-for-Indian-Kids-in-Need).

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
- `app.js`: native dialog controls, email copying, and the current-section navigation state.
- `cursor.js`: pointer interaction, cached static circuit drawing, and animation lifecycle. Moving lights up nearby traces; dragging launches packets through connected nodes. Reduced-motion and touch-only devices show the static board.
- `circuit-model.mjs`: responsive circuit graph, trace geometry, bounded signal routing, and cleanup.
- `circuit-painter.mjs`: chips, logic gates, proximity highlights, and packets moving along circuit traces.
- `echosense-scan.webp`: optimized image from the team's final MadHacks scans.
- `social-preview.png`: sharing preview.
- `favicon.svg`: site icon.

Fonts load from Google Fonts. The [scan gallery](https://github.com/AkshathCodes/EchoSense/blob/0a906a2fe4a9dd1e73a4666b74363942c633c61a/docs/SCANS.md) documents the featured image and its limitations. Hosting is managed separately from this source repository.
