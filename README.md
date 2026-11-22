# Alexandru Umbresi | The Cube

A cinematic, interactive personal portfolio built with **HTML, CSS, and vanilla JavaScript**. The opening places a spinning cube in a dark void. Click to enter through a sharp geometric transition, navigate between full-page 3D portfolio chambers, and zoom out again.

## Features

- Drag the cube to rotate it in 3D
- Click to enter with a fast, hyperspace-inspired portal animation
- Switch between About, Experience, Projects, and The Lab
- Interactive canvas experiment in The Lab
- Keyboard, pointer/touch, and reduced-motion support
- No frontend framework, package manager, or build step

## Run locally

Open `index.html` in a modern browser, or serve this directory locally:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Personalize before publication

- Edit your bio, experience, and project content in `index.html`.
- Update `CONFIG` at the top of `script.js` with your email, GitHub, LinkedIn, and resume URL.
- Customize colors, typography, animation, and room layouts in `styles.css`.
- Review all content before publishing publicly; the project currently includes starter information and placeholders.

## Publish with GitHub Pages

This folder is intended for a GitHub repository named `andujp.github.io`.

1. Create a **public** repository called `andujp.github.io` on GitHub. Don't initialize it with a README, since this project already has one.
2. Upload `index.html`, `styles.css`, `script.js`, `.gitignore`, and `README.md` into the **repository root** (not inside another folder).
3. Go to **Settings → Pages → Build and deployment**, select **Deploy from a branch**, choose **main** and **/(root)**, then save.
4. After GitHub Pages deploys, the intended site URL is `https://andujp.github.io/`.

Alternatively, clone the empty repository and use `git add`, `git commit`, and `git push` to upload the files.

## Status

Version 7 prototype. Not a production-ready portfolio. Future work includes refinement of transitions, content, performance, and accessibility.