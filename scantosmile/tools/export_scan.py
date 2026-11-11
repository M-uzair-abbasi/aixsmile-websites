"""The 'customer's scan': one arch as an intraoral scanner would send it
(crowns without wisdom teeth + gingiva + palate), in mm, two meshes
(teeth, gum) in one GLB for the page, plus one merged binary STL sample."""
import sys, numpy as np, trimesh
SRC, ARCH, OUT = sys.argv[1:4]
sc = trimesh.load(SRC, force='scene'); g = sc.graph
R, _ = g.get('human_dentition'); Ri = np.linalg.inv(R)
def mesh(n):
    T, geom = g.get(n); m = sc.geometry[geom].copy(); m.apply_transform(Ri @ T); return m
up = ARCH == 'upper'
quad = ('1', '2') if up else ('3', '4')
teeth = trimesh.util.concatenate([mesh(n) for n in g.nodes_geometry if n.startswith('tooth_') and n[6] in quad and n[7] != '8'])
gumparts = [mesh('maxillary_gingiva' if up else 'mandibular_gingiva')] + ([mesh('hard_palate')] if up else [])
gum = trimesh.util.concatenate(gumparts)
s = trimesh.Scene(); s.add_geometry(teeth, node_name='teeth', geom_name='teeth'); s.add_geometry(gum, node_name='gum', geom_name='gum')
s.export(f'{OUT}/scan-{ARCH}-raw.glb')
both = trimesh.util.concatenate([teeth, gum])
print(ARCH, 'teeth', len(teeth.faces), 'gum', len(gum.faces), 'bounds', np.round(both.bounds, 1).tolist())
both.export(f'{OUT}/scan-{ARCH}-full.stl')
