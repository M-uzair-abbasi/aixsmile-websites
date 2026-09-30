// The dentition as a stage for the bleaching treatment.
//
// Takes the loaded assets/models/dentition.glb (the veneer page's model: 32
// real crowns, both gums, a hinge for the bite) and adds what the story
// needs without changing any tooth's shape — bleaching changes colour only:
//   enamel   every crown shares one material; its colour multiplies the
//            crowns' warm vertex colour, from a natural A3.5 to BL4
//   barrier  a blue band along the gum line, drawn in the gum shader from a
//            per-vertex distance to the nearest crown (computed once here)
//   gel      a glossy mint coat over the visible teeth (15–25, 35–45),
//            pushed out along the normals so it stands on the enamel
// apply(state) takes sampleBleach() output and sets every piece; it never
// allocates. three.js classes come in as `T`, so this file imports nothing
// but the timeline (the node tests import it directly).
// Units are millimetres (the model's own), +z towards the visitor.
import { tintAt } from '../bleach-timeline.js';

const BITE_OPEN_DEG = 2.4;   // the source opens the jaw 10°; a smile shows a sliver
const BARRIER = 0x3f86c6;    // the light-cured gum protection
const GEL = 0x86d6bd;        // mint, clearly apart from the blue barrier
const BAND = 2.6;            // mm of gum next to the teeth that the barrier covers
const GEL_THICK = 0.22;      // mm the gel stands proud of the enamel
const GEL_TEETH = /^tooth_[1-4][1-5]_.*_crown$/;
const CLOSE_TEETH = ['13', '12', '11', '21', '22', '23'];
// the wide frame holds the smile from first premolar to first premolar;
// the second premolars run into the view's faded edges
const WIDE_TEETH = ['14', '13', '12', '11', '21', '22', '23', '24', '44', '43', '42', '41', '31', '32', '33', '34'];

/** For each gum vertex (flat xyz, mm) the distance to the nearest point of
 *  `crowns` (flat xyz arrays), capped at `cap`. A spatial hash with
 *  cap-sized cells keeps the search to the 27 neighbouring cells. */
export function gumDistances(gum, crowns, cap) {
  const cell = (v) => Math.floor(v / cap);
  const key = (x, y, z) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
  const grid = new Map();
  for (const c of crowns) {
    for (let i = 0; i < c.length; i += 3) {
      const k = key(cell(c[i]), cell(c[i + 1]), cell(c[i + 2]));
      let list = grid.get(k);
      if (!list) grid.set(k, (list = []));
      list.push(c[i], c[i + 1], c[i + 2]);
    }
  }
  const out = new Float32Array(gum.length / 3);
  for (let i = 0, n = 0; i < gum.length; i += 3, n++) {
    const x = gum[i], y = gum[i + 1], z = gum[i + 2];
    const cx = cell(x), cy = cell(y), cz = cell(z);
    let best = cap * cap;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const list = grid.get(key(cx + dx, cy + dy, cz + dz));
      if (!list) continue;
      for (let j = 0; j < list.length; j += 3) {
        const ex = list[j] - x, ey = list[j + 1] - y, ez = list[j + 2] - z;
        const d = ex * ex + ey * ey + ez * ez;
        if (d < best) best = d;
      }
    }
    out[n] = Math.sqrt(best);
  }
  return out;
}

/** A mesh's vertex positions in world space (mm), as a flat array. */
function worldPositions(T, mesh) {
  const a = mesh.geometry.getAttribute('position');
  const v = new T.Vector3();
  const out = new Float32Array(a.count * 3);
  for (let i = 0; i < a.count; i++) {
    v.fromBufferAttribute(a, i).applyMatrix4(mesh.matrixWorld);
    out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z;
  }
  return out;
}

// the gums' own material, plus a band of barrier blue where aTooth < BAND
function barrierMaterial(T, base) {
  const m = base.clone();
  m.userData.u = { uBarrier: { value: 0 }, uBarrierColor: { value: new T.Color(BARRIER) }, uBand: { value: BAND } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aTooth;\nvarying float vTooth;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTooth = aTooth;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTooth;\nuniform float uBarrier, uBand;\nuniform vec3 uBarrierColor;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bandM = 1.0 - smoothstep(uBand * 0.7, uBand, vTooth);
        diffuseColor.rgb = mix(diffuseColor.rgb, uBarrierColor, bandM * uBarrier);`);
  };
  m.customProgramCacheKey = () => 'bleach-barrier';
  return m;
}

// a glossy mint layer, pushed out along the normals and denser at the edges
// (where a real gel layer is seen at a slant) so it reads as a coating
function gelMaterial(T) {
  const m = new T.MeshPhysicalMaterial({
    color: GEL, transparent: true, opacity: 0, depthWrite: false,
    roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
  });
  m.userData.u = { uThick: { value: GEL_THICK } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uThick;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += normalize(objectNormal) * (uThick / length(modelMatrix[0].xyz));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <opaque_fragment>', `float gelEdge = 1.0 - abs(dot(normalize(vViewPosition), normal));
        diffuseColor.a = clamp(diffuseColor.a * (0.8 + 1.8 * gelEdge * gelEdge), 0.0, 0.95);
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'bleach-gel';
  return m;
}

export function buildBleachRig(T, gltfScene) {
  const root = gltfScene.getObjectByName('human_dentition');
  root.scale.setScalar(1);                       // work in millimetres
  const hinge = gltfScene.getObjectByName('maxillary_hinge');
  hinge.rotation.x = -T.MathUtils.degToRad(BITE_OPEN_DEG);
  gltfScene.updateMatrixWorld(true);

  const crowns = [], gums = {};
  gltfScene.traverse((o) => {
    if (!o.isMesh) return;
    if (/_crown$/.test(o.name)) crowns.push(o);
    else if (o.name === 'maxillary_gingiva') gums.upper = o;
    else if (o.name === 'mandibular_gingiva') gums.lower = o;
  });
  if (!crowns.length || !gums.upper || !gums.lower) throw new Error('dentition.glb: crowns or gums missing');
  const fdi = (o) => /^tooth_(\d\d)_/.exec(o.name)[1];

  // every crown shares the enamel material as authored
  const enamel = crowns[0].material;

  // the barrier band: each gum measured against its own arch's crowns
  const barrier = barrierMaterial(T, gums.upper.material);
  for (const [gum, arch] of [[gums.upper, /^[12]/], [gums.lower, /^[34]/]]) {
    const near = crowns.filter((c) => arch.test(fdi(c))).map((c) => worldPositions(T, c));
    gum.geometry.setAttribute('aTooth', new T.BufferAttribute(gumDistances(worldPositions(T, gum), near, BAND), 1));
    gum.material = barrier;
  }

  // the gel: an overlay on each visible tooth, sharing its crown's geometry
  const gelMat = gelMaterial(T);
  const gels = crowns.filter((c) => GEL_TEETH.test(c.name)).map((c) => {
    const g = new T.Mesh(c.geometry, gelMat);
    g.renderOrder = 2;
    g.visible = false;
    c.add(g);
    return g;
  });

  const measure = (objects) => {
    const box = new T.Box3();
    objects.forEach((o) => box.expandByObject(o));
    return { center: box.getCenter(new T.Vector3()), size: box.getSize(new T.Vector3()) };
  };
  const pick = (ids) => crowns.filter((c) => ids.includes(fdi(c)));
  const frames = { close: measure(pick(CLOSE_TEETH)), wide: measure(pick(WIDE_TEETH)) };

  const tint = [0, 0, 0];
  function apply(s) {
    tintAt(s.shade, tint);
    enamel.color.setRGB(tint[0], tint[1], tint[2]);
    barrier.userData.u.uBarrier.value = s.barrier;
    gelMat.opacity = 0.32 * s.gel;   // light enough that the lightening shows through
    const on = s.gel > 0.01;
    for (const g of gels) g.visible = on;
  }

  /** Make every piece visible once, so all shaders compile up front. */
  function showAll() { for (const g of gels) g.visible = true; }

  return { root, frames, apply, showAll };
}
