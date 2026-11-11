"""Split the aligner into one cap per tooth (for the exploded view).

Every triangle of the (simplified, decompressed) aligner goes to the crown
whose surface is nearest to its centre. Writes one GLB with 14 meshes named
"cap_<FDI>" in the same millimetre coordinates as the whole tray, so the caps
sit exactly where the tray was until the page pushes them apart.

  geo/bin/python tools/split_aligner.py aligner-upper-plain.glb dentition-plain.glb out/aligner-upper-parts.glb
"""
import sys

import numpy as np
import trimesh
from scipy.spatial import cKDTree

ALIGNER, DENT, OUT = sys.argv[1:4]
tray = trimesh.load(ALIGNER, force='mesh')

sc = trimesh.load(DENT, force='scene')
g = sc.graph
R, _ = g.get('human_dentition')
Ri = np.linalg.inv(R)
pts, lab = [], []
for n in g.nodes_geometry:
    if not n.startswith('tooth_') or n[6] not in '12' or n[7] == '8':
        continue
    T, geom = g.get(n)
    m = sc.geometry[geom].copy()
    m.apply_transform(Ri @ T)
    s = m.sample(6000)
    pts.append(s)
    lab += [n[6:8]] * len(s)
pts = np.vstack(pts)
lab = np.array(lab)
_, idx = cKDTree(pts).query(tray.triangles_center)
owner = lab[idx]

scene = trimesh.Scene()
for fdi in sorted(set(owner)):
    faces = np.where(owner == fdi)[0]
    part = tray.submesh([faces], append=True)
    scene.add_geometry(part, node_name=f'cap_{fdi}', geom_name=f'cap_{fdi}')
    print(fdi, len(faces), np.round(part.centroid, 1).tolist())
scene.export(OUT)
