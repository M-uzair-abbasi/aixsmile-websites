# AIXSMILE — Veneers (standalone microsite)

A single interactive page for the veneers treatment at AIXSMILE, Aachen. It is
deliberately **separate from the main aixsmile.de Next.js site**: no build step,
no framework, just static HTML/CSS/JS that can be hosted anywhere.

## What's here

- `index.html` — the whole page: styles, the DE/EN dictionary and the module
  script. A programmatically built 3D upper arch is pinned beside (laptop) or
  behind (phone) the scrolling copy; scroll drives the camera and seats six
  veneer shells onto the teeth (canines first, centrals last).
- `js/veneer-model.js` — the 3D model. Pure three.js geometry with a
  `setSeating(p)` control for the shells.
- `js/vendor/three/` — three.js 0.184, vendored so the page makes no
  third-party requests.
- `assets/fonts/` — self-hosted Space Grotesk and Inter (the main site's pair).
- `assets/steps/`, `assets/before-after/`, `assets/materials/` — photos for the
  step gallery, the before/after viewer and the material flip cards.
- `assets/tooth-mark.svg` — favicon.
- `viewer.html` + `js/three-d-stage.js` — a developer-only page to inspect and
  export the model (OBJ/GLB). Not linked from the site; safe to delete.

Colours, fonts and copy follow the main site (its `@theme` tokens and the
published veneers content), so the two read as one practice. The 3D model's
enamel, porcelain and gingiva colours are anatomical, not brand colours.

## Running locally

No build step. Serve the folder over http (ES modules do not load from
`file://`):

```
python3 -m http.server 8080
```

## Deploying

The site is deployed with the Vercel CLI (`vercel --prod`). `.vercelignore`
keeps local tool folders and this README out of the upload.

## Before going live

- A clinician should sign off on the page's claims, as with any other
  patient-facing content.
- No analytics or consent banner is wired up. Add whatever the practice's other
  pages use if this needs to match.
