# Veneer Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragile scroll-controlled veneer story with a premium, section-based dental landing page and a contained, explicitly controlled 3D explainer.

**Architecture:** Keep the static HTML site and vendored Three.js runtime. Move the 3D scene into `js/veneer-explainer.js` with a small state API, while `index.html` owns content, styling, language data, booking behavior, and section reveals. The model stays an educational visualization and is no longer coupled to page scroll.

**Tech Stack:** Vanilla HTML/CSS, ES modules, vendored Three.js 0.184, existing `build-en.mjs`, Playwright for local visual verification.

**Spec:** `docs/superpowers/specs/2026-09-26-veneer-page-redesign-design.md`

## Global Constraints

- Keep the static-site architecture and vendored Three.js runtime.
- Keep `/` as the German source page and preserve `build-en.mjs` as the English generator.
- Preserve booking form field names, order, IDs, API behavior, legal pages, cookie copy, and primary SEO URLs.
- Preserve the AIXSMILE logo, favicon, existing before-and-after assets, doctor image, material images, and map asset.
- Do not present the synthetic model as a clinical scan or a patient-specific result.
- Keep the page usable without WebGL, JavaScript animation, or a pointing device.
- Use one light visual theme with porcelain white, cool stone, graphite, deep navy, and the existing AIXSMILE blue accent.
- Do not attach 3D camera or model updates directly to scroll.

## Review Focus

- A 390x844 phone must not overlap the model, controls, cookie banner, or booking path. Test in Task 5.
- A WebGL-disabled browser must still receive the same three-state explanation. Test in Task 2.
- Keyboard and reduced-motion users must be able to use the explainer without animation. Test in Task 2.
- The model must remain fully inside its card in every state and canvas aspect ratio. Test in Task 2 and Task 5.
- The English build must retain the new labels and existing form behavior. Test in Task 4 and Task 5.

---

### Task 1: Replace the scroll-story shell with the new page structure

**Files:**
- Modify: `index.html:202-570` for design tokens, layout primitives, hero, explainer card, and responsive styles.
- Modify: `index.html:1320-1385` for header, hero, proof band, and contained explainer markup.
- Modify: `index.html:1386-1720` to reorder existing content without changing booking field names or legal copy.

**Interfaces:**
- Produces the stable DOM contract used by Task 2: `#veneerExplainer`, `#veneerScene`, `[data-veneer-state]`, `#veneerStateTitle`, `#veneerStateText`, and `#veneerFallback`.
- Preserves existing contracts: `#bkForm`, booking field names, `#beforeAfter`, `#materialien`, `#buchen`, `#langToggle`, and language data attributes.

- [ ] **Step 1: Capture current markup contracts before editing**

```bash
rg -n "id=\"(bkForm|beforeAfter|materialien|buchen|langToggle)|name=|data-cta|data-i18n" index.html
```

Expected: existing booking IDs, field names, language hooks, and CTA hooks are recorded and remain present after the redesign.

- [ ] **Step 2: Add the new section structure**

Replace the `.shell`, `.beats`, empty `data-anchor` blocks, and sticky stage with a hero, proof band, contained explainer, reading section, real cases, process, materials, cost, practice, and booking sections. Keep the existing content blocks inside their replacement sections.

- [ ] **Step 3: Add explicit 3D state controls and fallback markup**

```html
<div class="veneerStates" role="tablist" aria-label="Veneer Darstellung">
  <button type="button" role="tab" aria-selected="true" data-veneer-state="seated">Sitz</button>
  <button type="button" role="tab" aria-selected="false" data-veneer-state="veneer">Veneer</button>
  <button type="button" role="tab" aria-selected="false" data-veneer-state="before">Ausgangslage</button>
</div>
<div class="veneerCanvasFrame">
  <canvas id="veneerScene" aria-label="Dreidimensionale Darstellung eines Veneers"></canvas>
  <div id="veneerFallback" hidden>
    <img src="/assets/materials/keramik.jpg" alt="Keramik Veneer als statische Darstellung">
    <p>Die dreidimensionale Ansicht ist auf diesem Gerät nicht verfügbar. Die drei Behandlungsschritte werden darunter erklärt.</p>
  </div>
</div>
```

- [ ] **Step 4: Apply the visual system**

Use one light token set, 16px outer panel radius, 10px controls, visible focus rings, explicit mobile single-column layout, and `min-height: 100dvh` only where a full viewport is genuinely needed. Remove the stage grid, copy-over-canvas gradient, and `.beat` transition styles.

- [ ] **Step 5: Run markup and CSS sanity checks**

```bash
git diff --check
rg -n "beats|data-anchor|stagewrap|window\.addEventListener\('scroll'|Scrollen Sie" index.html
```

Expected: no old scroll-story selectors remain in the new hero structure and there are no whitespace errors.

- [ ] **Step 6: Commit the layout pass**

```bash
git add index.html
git commit -m "feat: restructure veneer landing page"
```

### Task 2: Extract the 3D explainer into a stable state machine

**Files:**
- Create: `js/veneer-explainer.js`
- Modify: `js/veneer-model.js:189-220` to keep seating deterministic and expose visible model bounds.
- Modify: `index.html` module script to import and initialize the explainer.

**Interfaces:**
- Consumes: `buildVeneerModel(THREE)` from `js/veneer-model.js`.
- Produces: `createVeneerExplainer({ THREE, canvas, fallback, controls, title, text })` returning `{ setState(name), destroy() }`.
- State names are exactly `before`, `veneer`, and `seated`.

- [ ] **Step 1: Write the browser state probe**

```js
await page.locator('[data-veneer-state="before"]').click();
await expect(page.locator('[data-veneer-state="before"]')).toHaveAttribute('aria-selected', 'true');
await page.locator('[data-veneer-state="seated"]').click();
await expect(page.locator('[data-veneer-state="seated"]')).toHaveAttribute('aria-selected', 'true');
```

Expected before implementation: FAIL because the new controls do not yet exist.

- [ ] **Step 2: Make model seating deterministic**

Change `setSeating(p)` so it accepts a stable scalar without time-based breathing. Add `getBounds()` returning a `THREE.Box3` after the selected state is applied. Keep presentation movement separate from the seated shell transform.

- [ ] **Step 3: Implement the explainer module**

```js
const STATE_SEATING = { before: 0, veneer: 0.5, seated: 1 };

export function createVeneerExplainer({ THREE, canvas, fallback, controls, title, text }) {
  return { setState, destroy };
}
```

Use one camera target derived from `getBounds()`, calculate distance from the current bounds and FOV, cap pixel ratio, and render only while visible or transitioning. State changes update the active button, title, supporting text, and canvas render.

- [ ] **Step 4: Add WebGL fallback and reduced-motion behavior**

If `WebGLRenderer` construction fails, hide the canvas and show `#veneerFallback`. If `prefers-reduced-motion: reduce` matches, apply the selected state immediately without interpolation.

- [ ] **Step 5: Wire keyboard interaction**

Arrow Left and Arrow Right move between the three state buttons. Enter and Space use the focused button. Keep tab order natural and use `aria-selected` on the tab buttons.

- [ ] **Step 6: Run the state probe and visual captures**

Expected: all three states select correctly, the model remains inside the frame, and no console errors appear.

- [ ] **Step 7: Commit the 3D explainer**

```bash
git add js/veneer-explainer.js js/veneer-model.js index.html
git commit -m "feat: add contained veneer explainer"
```

### Task 3: Remove legacy scroll coupling and finish section behavior

**Files:**
- Modify: `index.html` inline module script around camera anchors, `readScroll`, `frame`, Lenis setup, caption updates, and stage observer.
- Modify: `index.html` section reveal CSS and script.

**Interfaces:**
- Consumes: `createVeneerExplainer` from Task 2.
- Produces: section-level IntersectionObserver reveals and normal anchor navigation without scroll-driven 3D state.

- [ ] **Step 1: Remove legacy 3D scroll code**

Delete `ANCHOR_KEYS`, `anchorProgress`, `driveBeats`, `readScroll`, `distMul`, `coverFrac`, `liftFraction`, pointer parallax, intro dolly, idle camera orbit, and Lenis initialization used only by the old story.

- [ ] **Step 2: Add one-time section reveals**

Use IntersectionObserver to add `.is-visible` to sections entering the viewport. Animate only `opacity` and `transform`; reduced motion sets both immediately.

- [ ] **Step 3: Verify anchor navigation**

Click every header link and hero secondary link. Expected: the requested section lands below the fixed header without the 3D scene changing unexpectedly.

- [ ] **Step 4: Commit the interaction cleanup**

```bash
git add index.html
git commit -m "refactor: remove scroll-driven 3d choreography"
```

### Task 4: Preserve bilingual generation and content contracts

**Files:**
- Modify: `index.html` language dictionary and new `data-i18n` hooks.
- Modify: `build-en.mjs` only if the new markup introduces an unsupported translation attribute.
- Generate: `en/index.html` through the existing build script.

**Interfaces:**
- Consumes existing `I18N`, `data-i18n`, `data-i18n-alt`, and `data-i18n-aria` conventions.
- Produces German source page plus generated English page with matching structure and working language switch.

- [ ] **Step 1: Add translations for new visible strings**

Add German and English entries for the hero, proof band, three explainer states, controls, fallback copy, and section navigation. Keep proper nouns and form values unchanged.

- [ ] **Step 2: Run the English generator**

```bash
npm run build
```

Expected: `en/index.html written` with no missing translation warning for new page strings.

- [ ] **Step 3: Verify language switch and booking contract**

Load `/` and `/en/`, toggle language, inspect `#bkForm`, and verify all existing `name` attributes and form step controls remain unchanged.

- [ ] **Step 4: Commit bilingual output**

```bash
git add index.html build-en.mjs en/index.html
git commit -m "feat: localize redesigned veneer sections"
```

### Task 5: Responsive, accessibility, and performance verification

**Files:**
- Modify: `index.html` and `js/veneer-explainer.js` only for issues found by verification.
- Test: local browser captures and command-line build output.

- [ ] **Step 1: Run build and whitespace checks**

```bash
npm run build
git diff --check
```

Expected: build succeeds and the diff is clean.

- [ ] **Step 2: Capture desktop states**

At 1440x900 and 1280x800, capture the hero, explainer in all three states, case gallery, and booking section. Expected: no horizontal overflow, no cropped model, and hero CTA visible without scrolling.

- [ ] **Step 3: Capture mobile states**

At 390x844 and 360x800, capture the same sections. Expected: no overlap between model, controls, cookie banner, or booking content.

- [ ] **Step 4: Verify reduced motion**

Use `prefers-reduced-motion: reduce`. Expected: no continuous render loop, no scroll-scrubbed model movement, and all state content remains available.

- [ ] **Step 5: Verify fallback**

Run with WebGL blocked or force renderer creation to fail. Expected: the fallback panel is visible, controls still update the state copy, and no uncaught error reaches the console.

- [ ] **Step 6: Final source checks**

```bash
rg -n "window\.addEventListener\('scroll'|ANCHOR_KEYS|data-anchor|stagewrap|beats|Scrollen Sie" index.html js
git status --short
```

Expected: no legacy scroll-story implementation remains, and only intentional uncommitted changes are present.

- [ ] **Step 7: Commit the verified redesign**

```bash
git add index.html js/veneer-model.js js/veneer-explainer.js en/index.html
git commit -m "feat: finish veneer page redesign"
```
