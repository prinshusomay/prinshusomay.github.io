# prinshusomay.github.io

Personal site of **Prinshu Somay**, Bachelor of Management Studies, IIM Sirmaur.

Live at **https://prinshusomay.github.io**

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The whole page: projects, positions, results, training, education, contact |
| `assets/site.css` | All styling, including the Paper and Ink themes |
| `assets/site.js` | Interactions: live site checks, live previews, GitHub feed, rupee units, theme, copy email |
| `assets/shots/` | Screenshots of each live project (1280 × 800, WebP) |
| `assets/fonts/` | Self-hosted Libre Caslon, Libre Franklin and JetBrains Mono |
| `assets/Prinshu-Somay-CV.pdf` | The CV linked from the page |
| `assets/social/` | Showcase images: the link preview for the site and the media on LinkedIn |
| `preview/` | Small pages that give each showcase image its own link, then open the matching part of the site |

## What's interactive

- **Live status:** each project site is checked from the visitor's browser when the page loads, with its response time.
- **Live previews:** every screenshot frame can switch to the real site, running inside the page.
- **On GitHub, live:** repositories and the latest commit are read from the GitHub API on each visit.
- **Rupee units:** the Jio figures switch between millions (as filed) and crores.
- **Reading progress:** the red margin rule fills as you scroll, and its numerals jump between sections.
- **Three colour themes:** Midnight (the Jio terminal's teal and blue, default), Aurora (violet) and Paper (light), remembered per visitor.
- **Motion:** the name sets letter by letter, a prompt types what I'm working on, signal rings and satellites orbit the name (after the Jio terminal's tower) and follow the cursor, an aurora drifts behind the hero, a ticker runs headline numbers, headings reveal word by word, figures count up, and cards light up under the pointer. All of it stops for visitors who turn on reduced motion.

The design direction was explored in Google Stitch; the page itself is hand-written HTML, CSS and JavaScript with no framework or build step.

## Updating it

- **Swap the CV:** replace `assets/Prinshu-Somay-CV.pdf` with a file of the same name.
- **Add a project:** copy one of the `<article class="case">` blocks in `index.html` and its row in the project index, change the text and links, and put a 1280 × 800 screenshot in `assets/shots/`.
- **Change the date line:** search `index.html` for "October 2026".

There is no build step. Commit to `main` and GitHub Pages publishes the change within a minute or two.

## Projects linked from the site

- Jio IPO Terminal: https://jio-ipo.vercel.app ([code](https://github.com/prinshusomay/jio-ipo-terminal))
- Campus Infrastructure Management System: https://iims-cims.vercel.app ([code](https://github.com/prinshusomay/complaint-system), [React and Firebase version](https://github.com/prinshusomay/IIM-Sirmaur-Infra-IT))
- Infra-IT Complaint Portal: https://iims-infra-portal.vercel.app
