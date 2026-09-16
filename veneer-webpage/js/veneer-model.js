// Programmatic dental veneer study model. Real-world metres, y-up.
// buildVeneerModel(THREE) -> { root, model, veneers, setSeating }
// Ported verbatim from the design handoff — pure three.js geometry, no
// framework and no branding, so it needs no changes for this build.

export function buildVeneerModel(THREE) {
  const enamel = new THREE.MeshStandardMaterial({ name: 'enamel', color: 0xd9ccb4, roughness: 0.40, metalness: 0.04 });
  const porcelain = new THREE.MeshStandardMaterial({
    name: 'porcelain_veneer', color: 0xfffdf6, roughness: 0.09, metalness: 0.05, side: THREE.DoubleSide
  });
  // Calmer, cooler tissue and a neutral base: the warm beige puck and saturated
  // gum read as a dental training model against warm paper. A cool grey base
  // recedes and lets the porcelain shells carry the scene.
  const gingiva = new THREE.MeshStandardMaterial({ name: 'gingiva', color: 0xb37b7a, roughness: 0.68, metalness: 0.0 });
  const base = new THREE.MeshStandardMaterial({ name: 'model_base', color: 0x9aa2a9, roughness: 0.86, metalness: 0.0 });

  // Sculpt a sphere into a crown: neck at y=0, biting edge at y=-h.
  function sculpt(geo, w, h, d, o = {}) {
    const square = o.square ?? 0.78;
    const pointed = !!o.pointed;
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const sx = p.getX(i), sy = p.getY(i), sz = p.getZ(i);
      const t = Math.min(1, Math.max(0, (0.5 - sy)));
      const r = Math.hypot(sx, sz) / 0.5;
      const natural = Math.sqrt(Math.max(1e-4, 1 - Math.pow(2 * t - 1, 2)));
      const ring = Math.min(1, r / natural);
      let nx = 0, nz = 0;
      if (r > 1e-5) {
        const hx = sx / (r * 0.5), hz = sz / (r * 0.5);
        nx = Math.sign(hx) * Math.pow(Math.abs(hx), square);
        nz = Math.sign(hz) * Math.pow(Math.abs(hz), square);
      }
      let wp = 0.72 + 0.32 * Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5);
      let dp = 0.82 + 0.20 * Math.sin(Math.min(1, t * 1.5) * Math.PI * 0.5)
                    - 0.34 * Math.pow(Math.max(0, (t - 0.6) / 0.4), 2);
      if (pointed) {
        const k = Math.max(0, (t - 0.66) / 0.34);
        wp *= 1 - 0.86 * Math.pow(k, 1.5);
        dp *= 1 - 0.55 * Math.pow(k, 1.5);
      } else {
        const k = Math.max(0, (t - 0.90) / 0.10);
        const round = Math.sqrt(Math.max(0, 1 - k * k));
        wp *= 0.15 + 0.85 * round;
        dp *= 0.25 + 0.75 * round;
      }
      const kn = Math.max(0, (0.06 - t) / 0.06);
      const neckRound = Math.sqrt(Math.max(0, 1 - kn * kn));
      wp *= 0.25 + 0.75 * neckRound;
      dp *= 0.25 + 0.75 * neckRound;
      p.setXYZ(i, nx * ring * (w / 2) * wp, -h * t, nz * ring * (d / 2) * dp);
    }
    geo.computeVertexNormals();
    return geo;
  }

  const crownGeo = (w, h, d, o) => sculpt(new THREE.SphereGeometry(0.5, 56, 40), w, h, d, o);

  // a veneer is a thin facial shell: the same surface, a hair larger, wrapping
  // slightly past the proximal line angles and trimmed at the gingival margin
  const veneerGeo = (w, h, d, o) =>
    sculpt(new THREE.SphereGeometry(0.5, 48, 36, -0.42, Math.PI + 0.84, 0.30, Math.PI - 0.30),
      w * 1.055, h * 1.02, d * 1.06, o);

  const ARCH_A = 0.0270, ARCH_B = 0.0315;
  const TEETH = [
    { name: 'central_incisor', t: 0.165, w: 0.0090, h: 0.0112, d: 0.0068, veneer: true },
    { name: 'lateral_incisor', t: 0.480, w: 0.0075, h: 0.0093, d: 0.0062, veneer: true },
    { name: 'canine',          t: 0.790, w: 0.0082, h: 0.0110, d: 0.0078, veneer: true, pointed: true },
    { name: 'first_premolar',  t: 1.130, w: 0.0078, h: 0.0082, d: 0.0090, molar: true },
    { name: 'second_premolar', t: 1.480, w: 0.0076, h: 0.0076, d: 0.0092, molar: true },
    { name: 'first_molar',     t: 1.830, w: 0.0104, h: 0.0074, d: 0.0106, molar: true }
  ];

  const model = new THREE.Group();
  model.name = 'upper_arch';
  const veneers = [];

  for (const side of [-1, 1]) {
    const sideName = side < 0 ? 'left' : 'right';
    for (const t of TEETH) {
      const th = t.t * side;
      const anchor = new THREE.Group();
      anchor.name = `${sideName}_${t.name}_unit`;
      anchor.position.set(ARCH_A * Math.sin(th), 0, ARCH_B * Math.cos(th));
      anchor.rotation.y = Math.atan2(Math.sin(th) / ARCH_A, Math.cos(th) / ARCH_B);
      anchor.rotation.x = -0.05;

      const opts = { pointed: t.pointed, square: t.molar ? 0.62 : 0.78 };
      const crown = new THREE.Mesh(crownGeo(t.w, t.h, t.d, opts), enamel);
      crown.name = `${sideName}_${t.name}`;
      crown.position.z = -t.d * 0.16;
      anchor.add(crown);

      if (t.molar) {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const cusp = new THREE.Mesh(new THREE.SphereGeometry(t.w * 0.30, 24, 16), enamel);
          cusp.name = `cusp_${sideName}_${t.name}`;
          cusp.position.set(sx * t.w * 0.20, -t.h + t.w * 0.10, crown.position.z + sz * t.d * 0.22);
          cusp.scale.set(1, 0.78, 1);
          anchor.add(cusp);
        }
      }

      if (t.veneer) {
        // own material per shell so the contact glow can light one at a time
        const shell = new THREE.Mesh(veneerGeo(t.w, t.h, t.d, opts), porcelain.clone());
        shell.name = `veneer_${sideName}_${t.name}`;
        shell.position.set(0, 0, crown.position.z);
        shell.userData.rest = shell.position.clone();
        // hover distances in tooth widths, so the travel reads at any model scale
        shell.userData.hoverZ = t.w * 2.1;   // out toward the viewer (2.4 sent the canines to the stage edge)
        shell.userData.hoverY = t.w * 0.55;  // and a little above the prep
        shell.userData.fan = sideName === 'left' ? -1 : 1;
        shell.userData.lead = t.name === 'central_incisor' ? 1 : (t.name === 'lateral_incisor' ? 0.86 : 0.72);
        // seating order: canines first, centrals last
        shell.userData.order = t.name === 'canine' ? 0 : (t.name === 'lateral_incisor' ? 1 : 2);
        anchor.add(shell);
        veneers.push(shell);
      }

      const collar = new THREE.Mesh(new THREE.SphereGeometry(t.w * 0.42, 24, 16), gingiva);
      collar.name = `gingiva_${sideName}_${t.name}`;
      collar.scale.set(1.10, 0.30, 0.95);
      collar.position.set(0, 0.0002, crown.position.z);
      anchor.add(collar);

      model.add(anchor);
    }
  }

  // horseshoe profile in XY (front toward -y, so a -90° X rotation puts it at +z)
  function horseshoe(outerA, outerB, innerA, innerB, span) {
    const s = new THREE.Shape();
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const th = -span + (2 * span * i) / N;
      const x = outerA * Math.sin(th), y = -outerB * Math.cos(th);
      i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const th = -span + (2 * span * i) / N;
      s.lineTo(innerA * Math.sin(th), -innerB * Math.cos(th));
    }
    s.closePath();
    return s;
  }

  const ridge = new THREE.Mesh(
    new THREE.ExtrudeGeometry(horseshoe(0.0264, 0.0308, 0.0150, 0.0180, 1.98), {
      depth: 0.0072, bevelEnabled: true, bevelThickness: 0.0018, bevelSize: 0.0018, bevelSegments: 4
    }),
    gingiva
  );
  ridge.name = 'gingival_ridge';
  ridge.rotation.x = -Math.PI / 2;
  ridge.position.y = 0.0006;
  model.add(ridge);

  const palate = new THREE.Mesh(
    new THREE.SphereGeometry(1, 56, 20, 0, Math.PI * 2, 0, Math.PI / 2), gingiva);
  palate.name = 'palate';
  palate.rotation.x = Math.PI; // vault toward the crowns, so the occlusal view reads
  palate.scale.set(0.0176, 0.0066, 0.0206);
  palate.position.y = 0.0008;
  model.add(palate);

  const plate = new THREE.Mesh(
    new THREE.ExtrudeGeometry(horseshoe(0.0290, 0.0334, 0.0128, 0.0158, 2.04), {
      depth: 0.0038, bevelEnabled: true, bevelThickness: 0.0009, bevelSize: 0.0009, bevelSegments: 2
    }),
    base
  );
  plate.name = 'model_base_plate';
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = 0.0074;
  model.add(plate);

  model.rotation.z = Math.PI; // present teeth-up, like a study model on the bench

  const root = new THREE.Group();
  root.name = 'veneer_study_model';
  root.add(model);

  const c = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  root.position.x -= c.x;
  root.position.z -= c.z;

  // p = 0 all shells hovering well clear of the preps - over two tooth widths
  // out and fanned open, so the "before" is unmistakable - 1 all seated. Pairs
  // land in order (canines, laterals, centrals), each with a hard arrival, a
  // short settle wobble, and a flash of light on contact so the moment reads
  // as an event and not a drift.
  function setSeating(p) {
    const STAGGER = 0.24, SPAN = 0.42;
    for (const s of veneers) {
      const d = s.userData;
      const start = d.order * STAGGER;
      let u = (p - start) / SPAN;
      u = Math.min(1, Math.max(0, u));
      const ease = 1 - Math.pow(1 - u, 3.2);             // committed approach
      const snap = u < 0.82 ? ease * 0.92 : 0.92 + (u - 0.82) / 0.18 * 0.08; // last 8% lands in one beat
      const k = (1 - snap) * d.lead;
      const settle = u > 0.82 ? Math.sin((u - 0.82) / 0.18 * Math.PI * 2) * (1 - u) * 1.4 : 0;
      s.position.set(
        d.rest.x + d.fan * d.hoverZ * 0.18 * k,
        d.rest.y + d.hoverY * k,
        d.rest.z + d.hoverZ * k
      );
      s.rotation.x = -0.34 * k + settle * 0.03;
      s.rotation.y = d.fan * 0.22 * k;
      s.rotation.z = d.fan * 0.05 * k;
      // contact glow: a bright pulse as the shell lands, gone once it rests
      const flash = u > 0.86 && u < 1 ? Math.sin((u - 0.86) / 0.14 * Math.PI) : 0;
      s.material.emissive.setRGB(1, 0.97, 0.9);
      s.material.emissiveIntensity = flash * 0.55;
    }
  }

  return { root, model, veneers, setSeating };
}
