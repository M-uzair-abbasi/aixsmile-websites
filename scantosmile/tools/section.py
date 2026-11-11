"""Cut the aligner (and the tooth under it) with the plane x = X and write the
profile polylines (z, y in mm) for the page's blueprint drawing."""
import json, sys, numpy as np, trimesh
ALIGNER, DENT, X, OUT = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
a = trimesh.load(ALIGNER, force='mesh')
sc = trimesh.load(DENT, force='scene'); g = sc.graph
R, _ = g.get('human_dentition'); Ri = np.linalg.inv(R)
def mesh(n):
    T, geom = g.get(n); m = sc.geometry[geom].copy(); m.apply_transform(Ri @ T); return m
def cut(m, simplify=0.05):
    s = m.section(plane_origin=[X, 0, 0], plane_normal=[1, 0, 0])
    out = []
    for d in s.discrete:
        pl = trimesh.path.simplify.simplify_spline if False else None
        pts = d[:, [2, 1]]
        keep = [pts[0]]
        for p in pts[1:]:
            if np.linalg.norm(p - keep[-1]) >= simplify: keep.append(p)
        out.append(np.round(np.array(keep), 3).tolist())
    return out
tooth = [n for n in g.nodes_geometry if n.startswith('tooth_21')][0]
gum = mesh('maxillary_gingiva')
res = {'x': X, 'aligner': cut(a), 'tooth': cut(mesh(tooth)), 'gum': cut(gum, 0.15)}
for k in ('aligner', 'tooth', 'gum'):
    print(k, [len(p) for p in res[k]])
# wall thickness estimate at the labial face: distance between the outer and inner aligner loops
json.dump(res, open(OUT, 'w'))
