"""Build a clear aligner (one continuous thermoformed shell) from the dentition.

Input: the decompressed dentition GLB (crowns + gingiva, units mm after the
root's 0.001 scale is taken out). For one arch:
  teeth   solid occupancy of the crowns (surface voxels, filled slice by slice)
  sd      signed distance to the teeth (positive outside)
  outer   everything within WALL mm of the teeth, closed by CLOSE mm so the
          plastic bridges the gaps between teeth like a real formed tray
  cut     the trim line: the gum line traced where the crowns meet the
          gingiva, pushed OVER mm onto the gum, smoothed
  shell   f = min(sd, -sd_outer, cut) > 0, meshed at f = 0 by marching cubes
Writes <out>/aligner-<arch>.glb (+ a top-view outline JSON for the blueprint).
"""
import json
import sys
import time

import cv2
import numpy as np
import trimesh
from scipy import ndimage
from scipy.interpolate import griddata
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes

SRC, ARCH, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
PITCH = float(sys.argv[4]) if len(sys.argv) > 4 else 0.12
TARGET_FACES = int(sys.argv[5]) if len(sys.argv) > 5 else 70000
WALL = 0.42     # mm of plastic over the teeth
CLOSE = 0.85    # mm: gaps narrower than ~2x this get bridged
OVER = 0.9      # mm the trim line sits beyond the gum line
t0 = time.time()


def log(*a):
    print(f'[{time.time() - t0:5.1f}s]', *a, flush=True)


sc = trimesh.load(SRC, force='scene')
g = sc.graph
R, _ = g.get('human_dentition')
Ri = np.linalg.inv(R)


def mesh(n):
    T, geom = g.get(n)
    m = sc.geometry[geom].copy()
    m.apply_transform(Ri @ T)
    return m


upper = ARCH == 'upper'
quad = ('1', '2') if upper else ('3', '4')
crowns = {n: mesh(n) for n in g.nodes_geometry
          if n.startswith('tooth_') and n[6] in quad and n[7] != '8'}
gum = mesh('maxillary_gingiva' if upper else 'mandibular_gingiva')
log(ARCH, len(crowns), 'crowns')

lo = np.min([m.bounds[0] for m in crowns.values()], axis=0) - 2.5
hi = np.max([m.bounds[1] for m in crowns.values()], axis=0) + 2.5
shape = np.ceil((hi - lo) / PITCH).astype(int) + 1
log('grid', shape, f'{np.prod(shape) / 1e6:.1f}M voxels')


def to_idx(p):
    return np.round((p - lo) / PITCH).astype(int)


# --- teeth: surface voxels per crown, filled slice by slice (y = long axis)
teeth = np.zeros(shape, bool)
for name, m in crowns.items():
    pts = np.vstack([m.sample(int(m.area / (PITCH * PITCH) * 6)), m.vertices])
    idx = to_idx(pts)
    a, b = idx.min(0) - 2, idx.max(0) + 3
    local = np.zeros(b - a, bool)
    li = idx - a
    local[li[:, 0], li[:, 1], li[:, 2]] = True
    local = ndimage.binary_closing(local, iterations=1)
    for y in range(local.shape[1]):
        local[:, y, :] = ndimage.binary_fill_holes(local[:, y, :])
    teeth[a[0]:b[0], a[1]:b[1], a[2]:b[2]] |= local
log('teeth filled', int(teeth.sum()))


def sdist(mask):
    """Signed distance in mm, negative inside mask."""
    return (ndimage.distance_transform_edt(~mask).astype(np.float32)
            - ndimage.distance_transform_edt(mask).astype(np.float32)) * PITCH


sd = sdist(teeth)
log('sd teeth')
outer = sd <= WALL
dil = sdist(outer) <= CLOSE           # dilate by CLOSE ...
closed = (sdist(dil) <= -CLOSE) | outer   # ... then erode by CLOSE
del dil
sd_outer = sdist(closed)
log('outer closed')

# --- trim line: where the crowns meet the gum
gpts, _ = trimesh.sample.sample_surface(gum, 400000)
tree = cKDTree(gpts)
mpts = []
for m in crowns.values():
    pts = m.sample(30000)
    d, _ = tree.query(pts)
    mpts.append(pts[d < 0.12])
mpts = np.vstack(mpts)
# the crown also touches the gum inside the socket, higher up; the margin is
# the contact nearest the biting edge in each 0.5 mm column
cell = np.floor(mpts[:, [0, 2]] / 0.5).astype(int)
order = np.argsort(mpts[:, 1] if upper else -mpts[:, 1])
_, first = np.unique(cell[order], axis=0, return_index=True)
mpts = mpts[order[first]]
log('gum line points', len(mpts))
xs = lo[0] + np.arange(shape[0]) * PITCH
zs = lo[2] + np.arange(shape[2]) * PITCH
X, Z = np.meshgrid(xs, zs, indexing='ij')
H = griddata(mpts[:, [0, 2]], mpts[:, 1], (X, Z), method='linear')
Hn = griddata(mpts[:, [0, 2]], mpts[:, 1], (X, Z), method='nearest')
H = np.where(np.isnan(H), Hn, H)
H = ndimage.gaussian_filter(H, 1.2 / PITCH)
ys = lo[1] + np.arange(shape[1]) * PITCH
if upper:   # gum is up (+y): keep below the line + OVER
    cut = (H[:, None, :] + OVER) - ys[None, :, None]
else:       # gum is down
    cut = ys[None, :, None] - (H[:, None, :] - OVER)
cut = cut.astype(np.float32)
log('cut field', round(float(H.min()), 2), round(float(H.max()), 2))

f = np.minimum(np.minimum(sd, -sd_outer), cut)
del sd_outer
f = ndimage.gaussian_filter(f, 1.0)
verts, faces, _, _ = marching_cubes(f, level=0.0, spacing=(PITCH,) * 3)
verts += lo
log('marching cubes', len(faces))

m = trimesh.Trimesh(verts, faces, process=True)
parts = m.split(only_watertight=False)
m = max(parts, key=lambda p: len(p.faces))
log('largest part', len(m.faces), 'of', len(parts), 'parts', 'maxedge', round(float(m.edges_unique_length.max()), 2))

# simplification + compression happen in simplify.mjs (meshoptimizer):
# QEM in Python joined the two walls of the thin shell into spikes
m.export(f'{OUT}/aligner-{ARCH}-raw.glb')
log('raw written', len(m.faces))

# --- top view outlines for the blueprint (x right, z towards the visitor)
top = closed & (cut > 0)
mask = top.any(axis=1).T.astype(np.uint8) * 255          # rows = z, cols = x
cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = max(cs, key=cv2.contourArea)
c = cv2.approxPolyDP(c, 0.6, True)[:, 0, :]
outline = [[round(float(lo[0] + x * PITCH), 2), round(float(lo[2] + z * PITCH), 2)] for x, z in c]
toothlines = {}
for name, cm in crowns.items():
    tm = np.zeros_like(mask)
    idx = to_idx(cm.sample(20000))
    tm[np.clip(idx[:, 2], 0, tm.shape[0] - 1), np.clip(idx[:, 0], 0, tm.shape[1] - 1)] = 255
    tm = cv2.morphologyEx(tm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    tc, _ = cv2.findContours(tm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not tc:
        continue
    tcc = cv2.approxPolyDP(max(tc, key=cv2.contourArea), 0.8, True)[:, 0, :]
    toothlines[name[6:8]] = [[round(float(lo[0] + x * PITCH), 2), round(float(lo[2] + z * PITCH), 2)] for x, z in tcc]
json.dump({'outline': outline, 'teeth': toothlines, 'bounds': np.round(m.bounds, 2).tolist()},
          open(f'{OUT}/aligner-{ARCH}-top.json', 'w'))
log('outline points', len(outline), 'teeth', len(toothlines))
