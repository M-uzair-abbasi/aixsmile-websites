# Veneer page redesign

## Goal

Turn the Veneers in Aachen page into a calm, premium, conversion-focused dental landing page. The existing full-screen scroll story will be replaced by normal page sections and a contained 3D explainer with explicit controls.

## Design read

Trust-first premium dental landing page for prospective veneer patients in Aachen. The visual language is cool clinical luxury: porcelain white, cool stone, graphite, deep navy, and one AIXSMILE blue accent. Motion is restrained and explanatory rather than decorative.

Design dials: variance 5, motion 3, density 3.

## Non-negotiable constraints

- Keep the static-site architecture and vendored Three.js runtime.
- Keep `/` as the German source page and preserve `build-en.mjs` as the English generator.
- Preserve booking form field names, order, IDs, API behavior, legal pages, cookie copy, and primary SEO URLs.
- Preserve the AIXSMILE logo, favicon, existing before-and-after assets, doctor image, material images, and map asset.
- Do not present the synthetic model as a clinical scan or a patient-specific result.
- Keep the page usable without WebGL, JavaScript animation, or a pointing device.

## Information architecture

1. Header with logo, section links, language switch, phone action, and one booking CTA.
2. Hero: short promise, supporting sentence, primary booking CTA, secondary case link, and a real before-and-after preview.
3. Proof band: compact practice facts and a link to real cases.
4. 3D explainer: a contained model card with three explicit states: Ausgangslage, Veneer, Sitz.
5. Veneer explanation: what changes and what remains the patient's own tooth.
6. Real cases: existing before-and-after gallery.
7. Treatment process: five concise stages in a timeline.
8. Materials: ceramic and composite comparison with existing material images.
9. Suitability: honest criteria and cases where another treatment is better.
10. Doctor and practice section: existing doctor, address, map, and contact details.
11. Cost and booking section: existing booking form and cost content.
12. Footer with legal links and contact details.

The current scroll-anchor story, six empty journey blocks, and copy-over-canvas mobile composition are removed. Existing anchor IDs used by links remain available on their replacement sections.

## 3D explainer behavior

The 3D scene is a self-contained progressive enhancement, not the page's scroll engine.

- Default state is the seated six-front-unit result so the first render is useful.
- Three buttons or tabs select `before`, `veneer`, and `seated`.
- The selected state updates the model and caption inside the card.
- Desktop layout places the model beside a short explanation; mobile stacks the model, controls, and explanation.
- Scroll reveals the explainer section with opacity and transform only. It does not scrub camera position or model seating.
- Camera framing is calculated from the visible model bounds and the current canvas aspect ratio.
- The model's presentation transform is separate from the shell's seated transform.
- Idle orbit, pointer parallax, and continuous floating are removed from the explainer.
- `prefers-reduced-motion` disables transitions and displays the selected state immediately.
- A static fallback panel with an existing dental image and the same three labels appears when WebGL is unavailable.
- The canvas receives an accessible label and nearby text describes the three states.

The current approximate shell geometry remains usable for the first redesign pass, but it is reframed as an educational visualization. A future asset pass can replace it with a clinician-approved GLB without changing the page contract.

## Visual system

- One light theme across the page.
- Primary surfaces: porcelain white and cool stone.
- Text: graphite and deep navy.
- Accent: existing AIXSMILE blue, used consistently for links, focus, active controls, and primary action emphasis.
- One radius system: 16px outer panels, 10px controls, full-pill only for compact toggles.
- No decorative grid behind the 3D canvas.
- No dark inverted section in the middle of the page.
- No forced scroll cues or overlapping text beats.
- Hero headline fits in two lines on desktop and the primary CTA is visible without scrolling.

## Motion and performance

- Use IntersectionObserver or CSS view reveals for section entry.
- Do not attach a 3D camera or model update directly to `scroll`.
- The Three.js render loop runs only while the explainer is visible or while a state transition is active.
- Cap renderer pixel ratio to a conservative value and avoid unnecessary shadow-map updates.
- Animate only `opacity` and `transform` in the DOM.
- Reserve dimensions for images and the canvas to avoid layout shift.

## Acceptance criteria

- At 1440x900, the hero is understandable without scrolling and the model is not required to explain the page.
- At 390x844 and 360x800, the model, controls, copy, cookie banner, and booking path do not overlap.
- The 3D model remains fully inside its card in every state and at every supported viewport.
- Selecting each 3D state produces one stable, readable result with no ghosted text or camera drift.
- Keyboard users can reach and activate all 3D state controls and all focus states are visible.
- Reduced-motion users receive the same information without continuous animation.
- WebGL-disabled users receive an equivalent static explanation.
- `npm run build` generates `en/index.html` successfully.
- Existing booking, language switching, before-and-after viewer, legal links, and favicon continue to work.
