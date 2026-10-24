// The dentition as a glass world for the aligner journey.
//
// Takes assets/models/dentition.glb (the veneer page's model: 32 real crowns,
// both gums, a hinge for the bite; units mm, +z towards the visitor, every
// crown centred on its own origin) and builds what the story needs:
//   ice      every crown in one frosted-glass material with a bright rim; it
//            can dissolve into noise with a glowing edge (the scan)
//   crooked  each front tooth has an offset from its straight place (CROOKED);
//            the plan moves it home
//   hold     in the hero the set floats above a woman's open palm (the photo
//            behind it), turning slowly; scrolling lifts it out
//   points   each crown sampled into points that ride with it; a scan line
//            passes over them
//   shells   the aligner: every crown again, pushed out 0.5 mm, pale clear
//            plastic that reads by its darker edges. The bite opens, the upper
//            tray comes in under its teeth and is pushed on (its edges flash
//            as it clicks), then the lower one; a soft glint runs to the gums
// The gums and palate stay hidden: the teeth float on their own.
// apply(state, time) sets all of it from clear-timeline's sample(); it never
// allocates.
import {
  Mesh, Group, Points, BufferGeometry, BufferAttribute, Box3, Vector3, Color, MathUtils,
  MeshPhysicalMaterial, MeshStandardMaterial, ShaderMaterial, PlaneGeometry, AdditiveBlending, DoubleSide, NormalBlending,
} from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

const BITE_OPEN_DEG = 7;        // a little open, so both rows read as two arches
const BITE_TRAY_DEG = 8;        // opened further while the trays go on
const SHELL_THICK = 0.5;        // mm the aligner stands proud of the enamel
// where a tray comes from and where it waits before it is pushed on, mm in its
// arch's own axes (y away from its teeth, z towards the visitor)
const TRAY_FROM = { y: 13, z: 22 };
const TRAY_OFF = { y: 9.5, z: 1.2 };
const HIDE = /^tooth_[1-4]8_/;  // no wisdom teeth: a cleaner silhouette

/** Offsets from the straight place, mm and degrees (ry: turn about the long
 *  axis, rz: tip). The plan moves these to zero. Exported so the page can
 *  print the labels' numbers. */
export const CROOKED = {
  11: { x: 0.2, y: 0, z: 1.0, ry: 11 },
  21: { x: -0.1, y: -0.4, z: 0.3, ry: -6 },
  12: { x: 0.5, y: 0.3, z: -2.2, ry: 13 },
  22: { x: -0.3, y: 0, z: -1.4, ry: -11, rz: 4 },
  13: { x: 0.3, y: 2.0, z: 1.6, ry: 6 },
  23: { x: -0.2, y: 0.6, z: 0.8, ry: -5 },
  14: { ry: 5 },
  24: { ry: -4 },
  41: { x: 0.3, z: 1.0, ry: 13 },
  31: { x: -0.2, z: -0.6, ry: -9 },
  42: { x: 0.2, z: -1.6, ry: 12 },
  32: { x: -0.2, z: 0.8, ry: -8 },
  43: { y: 0.9, ry: 6 },
  33: { ry: -4 },
};

// GLSL: cheap 3D value noise
const NOISE = /* glsl */`
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

// frosted glass with a bright rim; dissolves into noise with a glowing edge
function iceMaterial(opts) {
  const m = new MeshPhysicalMaterial({
    color: 0xbcc4d4, roughness: 0.42, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.22,
    sheen: 0.3, sheenColor: new Color(0xaebcf0), sheenRoughness: 0.6,
    envMapIntensity: 0.7, ...opts,
  });
  m.userData.u = {
    uDissolve: { value: 0 },
    uRim: { value: 0.5 },
    uRimColor: { value: new Color(0xe6eeff) },
    uEdgeColor: { value: new Color(0xa8c8ff) },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vObj;\nuniform float uDissolve, uRim;\nuniform vec3 uRimColor, uEdgeColor;\n${NOISE}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float dn = vnoise(vObj * 0.85) * 0.62 + vnoise(vObj * 2.6) * 0.38;
        float th = uDissolve * 1.18 - 0.09;
        if (dn < th) discard;
        float edge = (1.0 - smoothstep(0.0, 0.07, dn - th)) * step(0.002, uDissolve);
        float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 3.2);
        totalEmissiveRadiance += uEdgeColor * edge * 1.6 + uRimColor * fres * uRim;`);
  };
  m.customProgramCacheKey = () => 'clear-ice';
  return m;
}

// the aligner: clear plastic, pushed out along the normals, formed up to a level
function shellMaterial(upper) {
  const m = new MeshStandardMaterial({
    color: 0xdbe4ff, roughness: 0.14, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false,
    envMapIntensity: 1.2,
  });
  m.userData.u = {
    uThick: { value: SHELL_THICK }, uLevel: { value: upper ? -2 : 2 }, uFade: { value: 0 },
    uAway: { value: 0 }, uClick: { value: 0 }, uGlint: { value: 0 },
  };
  const side = upper ? '1.0' : '-1.0';
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uThick;\nvarying vec3 vWorld;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += normalize(objectNormal) * (uThick / length(modelMatrix[0].xyz));`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uLevel, uFade, uAway, uClick, uGlint;\nvarying vec3 vWorld;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        // clear plastic on light teeth reads by its edges: where the surface
        // turns away, the tray darkens to a slate-blue line. Off the teeth its
        // body is a little denser (uAway), so the tray reads as one piece; as
        // it clicks on, its edges flash ice blue (uClick); a soft band of light
        // runs from the biting edge to the gums once it has seated
        float lv = (uLevel - vWorld.y) * ${side};
        float band = (1.0 - smoothstep(0.0, 1.2, abs(lv))) * uGlint;
        vec3 prism = 0.5 + 0.5 * cos(6.2831 * (vWorld.x * 0.035 + vWorld.y * 0.02 + vec3(0.0, 0.33, 0.67)));
        float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 1.7);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.22, 0.5), fres * 0.92);
        diffuseColor.a = clamp(diffuseColor.a + 0.06 + uAway * 0.12 + fres * (0.78 + 0.2 * uClick) + band * 0.18, 0.0, 0.94) * uFade;
        totalEmissiveRadiance += (prism * band * 0.4 + vec3(0.25, 0.36, 1.0) * fres * uClick * 0.9) * uFade;`);
  };
  m.customProgramCacheKey = () => `clear-shell-${upper ? 'u' : 'l'}`;
  return m;
}

// scan points: slate dots that flare white where the scan line passes
function pointsMaterial() {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, blending: NormalBlending,
    uniforms: {
      uOpacity: { value: 0 }, uSweepX: { value: -40 }, uSize: { value: 1 }, uScale: { value: 600 }, uTime: { value: 0 },
      uColor: { value: new Color(0x4d5570) }, uHot: { value: new Color(0xffffff) },
    },
    vertexShader: /* glsl */`
      attribute float aRand;
      uniform float uSweepX, uSize, uScale, uTime, uOpacity;
      varying float vHot, vA;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float d = wp.x - uSweepX;
        vHot = 1.0 - smoothstep(0.0, 3.2, abs(d));
        vec4 mv = viewMatrix * wp;
        gl_PointSize = uSize * (1.0 + vHot * 1.8) * (uScale / -mv.z);
        gl_Position = projectionMatrix * mv;
        // behind the line (already scanned) the points are solid, ahead they shimmer
        float tw = 0.7 + 0.3 * sin(uTime * 2.2 + aRand * 40.0);
        vA = uOpacity * mix(tw * (0.35 + 0.65 * step(d, 0.0)), 1.0, vHot);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor, uHot;
      varying float vHot, vA;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        if (r > 0.5) discard;
        float a = vA * (1.0 - smoothstep(0.25, 0.5, r));
        gl_FragColor = vec4(mix(uColor, uHot * 2.2, vHot), a);
      }`,
  });
}

// the scan line itself: a thin sheet of light across the arches
function sweepMaterial() {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform float uOpacity; varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(0.0, 0.18, 1.0 - vUv.x) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(0.0, 0.25, 1.0 - vUv.y);
        gl_FragColor = vec4(vec3(0.55, 0.75, 1.0), uOpacity * edge * 0.3);
      }`,
  });
}

export function buildClearRig(gltfScene, { pointScale = 1 } = {}) {
  const root = gltfScene.getObjectByName('human_dentition');
  root.scale.setScalar(1);                       // work in millimetres
  const hinge = gltfScene.getObjectByName('maxillary_hinge');
  hinge.rotation.x = -MathUtils.degToRad(BITE_OPEN_DEG);
  gltfScene.updateMatrixWorld(true);

  const ice = iceMaterial();
  const iceBase = ice.color.clone();
  const pointsMat = pointsMaterial();
  const shellUpper = shellMaterial(true), shellLower = shellMaterial(false);

  const teeth = [];
  const sampled = new Vector3();
  gltfScene.traverse((o) => {
    if (!o.isMesh) return;
    if (/_crown$/.test(o.name)) {
      if (HIDE.test(o.name)) { o.visible = false; return; }
      teeth.push(o);
    } else o.visible = false;   // gums and palate: the teeth float on their own
  });
  if (teeth.length < 20) throw new Error('dentition.glb: crowns missing');
  const fdi = (o) => /^tooth_(\d\d)_/.exec(o.name)[1];

  const rig = teeth.map((mesh) => {
    const id = fdi(mesh);
    const upper = id[0] === '1' || id[0] === '2';
    mesh.material = ice;
    mesh.renderOrder = 2;
    const home = mesh.position.clone();
    const homeRot = mesh.rotation.clone();
    const c = CROOKED[id] || {};

    // the scan points ride with the tooth
    const s = new MeshSurfaceSampler(mesh).build();
    const count = Math.round((/^tooth_[1-4][1-3]_/.test(mesh.name) ? 1500 : /^tooth_[1-4][45]_/.test(mesh.name) ? 1050 : 950) * pointScale);
    const pos = new Float32Array(count * 3), rnd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s.sample(sampled);
      pos[i * 3] = sampled.x; pos[i * 3 + 1] = sampled.y; pos[i * 3 + 2] = sampled.z;
      rnd[i] = Math.random();
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new BufferAttribute(rnd, 1));
    const pts = new Points(geo, pointsMat);
    pts.renderOrder = 3;
    pts.visible = false;
    pts.frustumCulled = false;
    mesh.add(pts);

    // the aligner over this tooth
    const shell = new Mesh(mesh.geometry, upper ? shellUpper : shellLower);
    shell.renderOrder = 4;
    shell.visible = false;
    mesh.add(shell);

    return { id, mesh, upper, home, homeRot, c, pts, shell };
  });

  // the scan line: a sheet across both arches, moved along x
  const sweepMat = sweepMaterial();
  const sweep = new Mesh(new PlaneGeometry(64, 26), sweepMat);
  sweep.rotation.y = Math.PI / 2;
  sweep.position.set(0, 0, -20);
  sweep.visible = false;
  sweep.renderOrder = 5;
  gltfScene.add(sweep);

  // framing: the whole set without wisdom teeth, measured straight and landed
  const box = new Box3();
  rig.forEach((t) => box.expandByObject(t.mesh));
  const frames = { all: { center: box.getCenter(new Vector3()), size: box.getSize(new Vector3()) } };

  // the whole set turns about its own centre while it floats above her palm
  const pivot = new Group();
  pivot.position.copy(frames.all.center);
  gltfScene.add(pivot);
  pivot.attach(root);

  const SWEEP_SPAN = 34;
  const trayU = { in: 0, away: 1, y: 0, z: 0 }, trayL = { in: 0, away: 1, y: 0, z: 0 };

  function apply(st, time) {
    const k = 1 - st.straight, h = st.hold;
    // in her hand: a slow turn and a gentle float; it settles as it comes out
    pivot.rotation.y = h * Math.sin(time * 0.45) * 0.38;
    pivot.position.y = frames.all.center.y + h * Math.sin(time * 1.1) * 0.6;
    for (const t of rig) {
      const { mesh, home, homeRot, c } = t;
      mesh.position.set(home.x + (c.x || 0) * k, home.y + (c.y || 0) * k, home.z + (c.z || 0) * k);
      mesh.rotation.set(
        homeRot.x,
        homeRot.y + MathUtils.degToRad(c.ry || 0) * k,
        homeRot.z + MathUtils.degToRad(c.rz || 0) * k,
      );
      t.pts.visible = st.points > 0.004;
    }
    // the bite opens wider while the trays go on
    hinge.rotation.x = -MathUtils.degToRad(BITE_OPEN_DEG + BITE_TRAY_DEG * st.open);
    ice.userData.u.uDissolve.value = st.dissolve;
    ice.color.copy(iceBase).multiplyScalar(1 - 0.2 * st.tray3d);
    ice.userData.u.uRim.value = 0.5 - 0.34 * st.tray3d;
    pointsMat.uniforms.uOpacity.value = st.points;
    pointsMat.uniforms.uSweepX.value = st.sweep * SWEEP_SPAN;
    pointsMat.uniforms.uTime.value = time;
    // the sheet of light is there while the line crosses the arches
    const onArch = Math.min(1, Math.max(0, (1.2 - Math.abs(st.sweep)) * 3));
    sweepMat.uniforms.uOpacity.value = st.points * onArch;
    sweep.visible = sweepMat.uniforms.uOpacity.value > 0.004;
    sweep.position.x = st.sweep * SWEEP_SPAN;
    // the trays, one arch at a time: each comes in from the front to wait
    // just off its teeth, then is pushed on, faster at the end (the click)
    const up = trayAt(st.upIn, st.upSeat, trayU), lo = trayAt(st.loIn, st.loSeat, trayL);
    for (const t of rig) {
      const o = t.upper ? up : lo, s = t.mesh.scale.x;   // shells sit in the crown's own (scaled) units
      t.shell.visible = st.tray3d > 0.004 && o.in > 0.004;
      t.shell.position.set(0, (t.upper ? -o.y : o.y) / s, o.z / s);
    }
    setTray(shellUpper, st, up, st.upClick);
    setTray(shellLower, st, lo, st.loClick);
    shellUpper.userData.u.uLevel.value = -3 + 16 * st.form;
    shellLower.userData.u.uLevel.value = 3 - 16 * st.form;
  }

  // where a tray is (mm away from its teeth, along y and z) for how far it
  // has come in (inK) and been pushed on (seatK)
  function trayAt(inK, seatK, out) {
    const a = 1 - (1 - inK) * (1 - inK), left = 1 - seatK * seatK * seatK;
    out.in = inK;
    out.away = left;
    out.y = (TRAY_FROM.y + (TRAY_OFF.y - TRAY_FROM.y) * a) * left;
    out.z = (TRAY_FROM.z + (TRAY_OFF.z - TRAY_FROM.z) * a) * left;
    return out;
  }
  function setTray(mat, st, o, click) {
    const u = mat.userData.u;
    u.uFade.value = st.tray3d * Math.min(1, o.in * 2.5);
    u.uAway.value = o.away;
    u.uClick.value = click;
    u.uGlint.value = Math.min(1, st.form * 6);   // the glint only once both trays sit
  }

  /** Point size in px at 1 mm from the camera, so dots look the same at any size. */
  function setPointScale(px) { pointsMat.uniforms.uScale.value = px; }

  /** Make every piece visible once, so all shaders compile up front. */
  function showAll() {
    for (const t of rig) { t.pts.visible = true; t.shell.visible = true; }
    sweep.visible = true;
  }

  const byId = new Map(rig.map((t) => [t.id, t]));
  return { root, frames, rig, byId, apply, showAll, setPointScale };
}
