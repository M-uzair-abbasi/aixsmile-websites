# Builds the hero's photo layers from the AI sources in tools/ai-src/. The
# journey copies the 3D version step by step, on her photo:
#   face-A.png    her smile, crooked teeth (hero, scan)
#   face-E.png    the same, teeth straight (the plan moves A → E)
#   face-Eo.png   straight, the bite open (the aligners go on here)
#   face-EoT.png  bite open, both aligners on
#   face-D.png    bite closed, aligners on
#   face-hand.png straight smile, an aligner in her hand (the end; her hand
#                 changes the whole lower picture, so it is a photo of its own)
#   face-mask.png / face-mask-open.png  the mouth opening, closed / open
#   face-jaw.png  where opening the bite changes her face (soft-edged)
#   face-tags.json where the labelled teeth are (pixels)
# Everything is identical outside the mouth (or the jaw), so the page shows
# face.webp once and only swaps the region that changes.
#
# Writes assets/photos/face/:
#   face.webp            the photo (A), backdrop cooled to the page's lilac-grey
#   plan.webp            7 mouth frames, crooked → straight (optical-flow morphs,
#                        so the teeth glide instead of cross-fading)
#   tray.webp            7 jaw frames: straight, bite opening, open, upper
#                        aligner on, both on, bite closing, closed with aligners
#   tray-u/-l.webp       the two aligners on their own (pale clear plastic with
#                        slate edges and the highlights of the real ones): they
#                        come in, wait in front of the teeth and are pushed on
#   points/mesh.webp     the scan's dot cloud and wireframe (masks)
#   teeth.webp           the teeth under the aligners (the glint's mask)
#   end.webp             the end: her straight smile, holding an aligner
# and assets/stills/ (the share picture, the chapter pictures for reduced motion).
#
# Run: python3 tools/make-face-layers.py   (OpenCV + numpy + Pillow)
# It prints the FACE numbers for js/site.js.
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, 'ai-src')
OUT = os.path.join(ROOT, 'assets', 'photos', 'face')
STILLS = os.path.join(ROOT, 'assets', 'stills')
os.makedirs(OUT, exist_ok=True)

ICE = (0x3a, 0x46, 0xc9)        # --ice
FIELD = (0xd2, 0xd4, 0xdd)      # the cooled backdrop = the stage's colour
PLAN_STEPS = 6                   # morph frames crooked → straight


def load(name, flag=cv2.IMREAD_COLOR):
    im = cv2.imread(os.path.join(SRC, name), flag)
    if im is None:
        sys.exit(f'missing tools/ai-src/{name}')
    return im


A, E, Eo, EoT, D = (load(f'face-{k}.png') for k in ('A', 'E', 'Eo', 'EoT', 'D'))
H, W = A.shape[:2]


def soft(mask, grow=9, blur=4):
    m = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow, grow)))
    return cv2.GaussianBlur(m, (0, 0), blur).astype(np.float32)[..., None] / 255


mask = load('face-mask.png', cv2.IMREAD_GRAYSCALE)
mask_open = load('face-mask-open.png', cv2.IMREAD_GRAYSCALE)
jaw = load('face-jaw.png', cv2.IMREAD_GRAYSCALE).astype(np.float32)[..., None] / 255
mouth_a = soft(mask)


# ---------- the backdrop: warm studio grey → the page's cool lilac-grey ----------
# near-neutral, light pixels move toward the target hue; skin, lips, hair and
# teeth are far from neutral (or dark, or in the mouth) and stay put. The
# weights come from face A and are applied to every image alike (the end
# photo, with her hand, gets its own).
def lab_of(rgb):
    return cv2.cvtColor(np.array([[rgb[::-1]]], np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)[0, 0]


warm, cool = lab_of((0xd8, 0xd2, 0xcd)), lab_of((0xd5, 0xd7, 0xe1))


def weights(im):
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
    L, a, b = lab[..., 0] * 100 / 255, lab[..., 1] - 128, lab[..., 2] - 128
    dist = np.hypot(a - (warm[1] - 128), b - (warm[2] - 128))
    w = np.exp(-(dist / 6.0) ** 2) * np.clip((L - 55) / 15, 0, 1)
    w = cv2.GaussianBlur(w, (0, 0), 1.5)
    w[(jaw[..., 0] > 0.01) | (cv2.dilate(mask, np.ones((41, 41), np.uint8)) > 0)] = 0
    return w


wgt = weights(A)


def cooled(im, w=wgt):
    lb = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
    lb[..., 1] += w * (cool[1] - warm[1])
    lb[..., 2] += w * (cool[2] - warm[2])
    return cv2.cvtColor(lb.clip(0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)


A, E, Eo, EoT, D = (cooled(x) for x in (A, E, Eo, EoT, D))
hand = load('face-hand.png')
hand = cooled(hand, weights(hand))


def webp(im, path, q=84, size=None, rgba=False):
    pil = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGRA2RGBA if rgba else cv2.COLOR_BGR2RGB))
    if size:
        pil = pil.resize(size, Image.LANCZOS)
    pil.save(path, 'WEBP', quality=q, method=6)
    print(f'  {os.path.relpath(path, ROOT)}  {pil.size[0]}x{pil.size[1]}  {os.path.getsize(path) // 1024} KB')


def box_of(m, margin):
    ys, xs = np.nonzero(m)
    x0, y0, x1, y1 = xs.min() - margin, ys.min() - margin, xs.max() + margin, ys.max() + margin
    return x0 - x0 % 2, y0 - y0 % 2, x1 + x1 % 2, y1 + y1 % 2


MB = box_of(cv2.dilate(mask, np.ones((9, 9), np.uint8)), 14)      # the mouth box (scan, plan)
JB = box_of(jaw[..., 0] > 0.01, 0)                                  # the jaw box (aligners)
cut = lambda im, bx: im[bx[1]:bx[3], bx[0]:bx[2]]


# ---------- frames: a dense flow between two images, both warped toward the
# middle and blended, so teeth slide instead of cross-fading ----------
def morph(p, q, t):
    gp, gq = cv2.cvtColor(p, cv2.COLOR_BGR2GRAY), cv2.cvtColor(q, cv2.COLOR_BGR2GRAY)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    f_pq, f_qp = dis.calc(gp, gq, None), dis.calc(gq, gp, None)
    h, w = gp.shape
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    wp = cv2.remap(p, gx - t * f_pq[..., 0], gy - t * f_pq[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    wq = cv2.remap(q, gx - (1 - t) * f_qp[..., 0], gy - (1 - t) * f_qp[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    s = t * t * (3 - 2 * t)
    return (wp.astype(np.float32) * (1 - s) + wq.astype(np.float32) * s).clip(0, 255).astype(np.uint8)


def keep(frame, alpha, bx, base):
    """the frame inside alpha, the base photo outside"""
    al = cut(alpha, bx)
    return (frame.astype(np.float32) * al + cut(base, bx).astype(np.float32) * (1 - al)).astype(np.uint8)


print('writing')
webp(A, os.path.join(OUT, 'face.webp'), 82)
webp(hand, os.path.join(OUT, 'end.webp'), 82)

# the plan: crooked → straight, in the mouth box
plan = [cut(A, MB)] + [keep(morph(cut(A, MB), cut(E, MB), i / PLAN_STEPS), mouth_a, MB, A) for i in range(1, PLAN_STEPS + 1)]
webp(np.vstack(plan), os.path.join(OUT, 'plan.webp'), 86)


# ---------- the two arches of the open bite: split along the dark gap ----------
def teeth_in(im, m):
    lb = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
    t = ((lb[..., 0] > 150) & (lb[..., 1] - 128 < 14)).astype(np.uint8) * 255
    t[m == 0] = 0
    return cv2.morphologyEx(t, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))


gray = cv2.GaussianBlur(cv2.cvtColor(Eo, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 3)
cols = np.nonzero(mask_open.any(axis=0))[0]
split = np.full(W, np.nan)
for x in cols:
    ys = np.nonzero(mask_open[:, x])[0]
    if len(ys) < 12:
        continue
    lo, hi = ys.min() + len(ys) // 4, ys.max() - len(ys) // 4
    split[x] = lo + np.argmin(gray[lo:hi + 1, x])
ok = ~np.isnan(split)
split = np.interp(np.arange(W), np.nonzero(ok)[0], split[ok])
split = np.convolve(split, np.ones(41) / 41, mode='same')
above = (np.arange(H)[:, None] < split[None, :]).astype(np.uint8) * 255
upper_m = cv2.bitwise_and(mask_open, above)
lower_m = cv2.bitwise_and(mask_open, 255 - above)
ua = soft(upper_m, 5, 2)
EoU = (EoT.astype(np.float32) * ua + Eo.astype(np.float32) * (1 - ua)).astype(np.uint8)

# opening and closing the bite moves the lower jaw too far for a plain flow:
# seed it with the jaw's own movement (everything below the bite line slides
# down, less over the chin, none at the cheeks), then let Farneback refine it
def jaw_morph(p, q, ts, drop):
    gp, gq = cv2.cvtColor(p, cv2.COLOR_BGR2GRAY), cv2.cvtColor(q, cv2.COLOR_BGR2GRAY)
    h, w = gp.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    bite = np.interp(xx + JB[0], np.arange(W), split) - JB[1]
    prof = np.clip((yy - bite) / 30, 0, 1) * np.clip((h - 30 - yy) / 220, 0.25, 1) * (yy < h - 30)
    side = np.clip(1 - (np.abs(xx - w / 2) - 230) / 120, 0, 1)
    seed = np.zeros((h, w, 2), np.float32); seed[..., 1] = drop * prof * side
    fb = lambda a, b, f0: cv2.calcOpticalFlowFarneback(a, b, f0.copy(), 0.5, 5, 31, 6, 7, 1.5, cv2.OPTFLOW_USE_INITIAL_FLOW)
    f_pq, f_qp = fb(gp, gq, seed), fb(gq, gp, -seed)
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    out = []
    for t in ts:
        wp = cv2.remap(p, gx - t * f_pq[..., 0], gy - t * f_pq[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        wq = cv2.remap(q, gx - (1 - t) * f_qp[..., 0], gy - (1 - t) * f_qp[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        s = t * t * (3 - 2 * t)
        out.append((wp.astype(np.float32) * (1 - s) + wq.astype(np.float32) * s).clip(0, 255).astype(np.uint8))
    return out


# the jaw frames: straight → bite opening → open → upper on → both on →
# closing → closed with aligners
J = lambda im: cut(im, JB)
drop = 40.0   # how far her lower teeth go down when the bite opens (px, measured on face-Eo)
tray = [J(E), *jaw_morph(J(E), J(Eo), (1 / 3, 2 / 3), drop), J(Eo), J(EoU), J(EoT), *jaw_morph(J(EoT), J(D), (1 / 3, 2 / 3), -drop), J(D)]
tray = [keep(f, jaw, JB, E) for f in tray]
webp(np.vstack(tray), os.path.join(OUT, 'tray.webp'), 82)


# ---------- the aligners on their own: pale clear plastic in the shape of the
# arch, slate edges, and the highlights the real ones add ----------
def ink(alpha, rgb):
    h, w = alpha.shape
    o = np.zeros((h, w, 4), np.float32)
    o[..., 0], o[..., 1], o[..., 2], o[..., 3] = rgb[2], rgb[1], rgb[0], alpha
    return o


def over(dst, src):
    sa = src[..., 3:4] / 255
    da = dst[..., 3:4] / 255
    oa = sa + da * (1 - sa)
    rgb = (src[..., :3] * sa + dst[..., :3] * da * (1 - sa)) / np.maximum(oa, 1e-6)
    return np.concatenate([rgb, oa * 255], axis=2)


def aligner(arch_mask):
    t = teeth_in(Eo, arch_mask)
    shape = cv2.morphologyEx(t, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    shape = cv2.GaussianBlur(shape, (0, 0), 1.2)
    edge = cv2.morphologyEx(shape, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    lift = cv2.cvtColor(EoT, cv2.COLOR_BGR2GRAY).astype(np.float32) - cv2.cvtColor(Eo, cv2.COLOR_BGR2GRAY).astype(np.float32)
    hl = np.clip(lift / 50, 0, 1) * (cv2.dilate(shape, np.ones((7, 7), np.uint8)) > 0)
    layer = ink(shape.astype(np.float32) * 0.34, (0xdb, 0xe4, 0xff))
    layer = over(layer, ink(edge.astype(np.float32) * 0.6, (0x4a, 0x55, 0x80)))
    layer = over(layer, ink(hl * 235, (255, 255, 255)))
    return cut(layer.clip(0, 255).astype(np.uint8), JB)


webp(aligner(upper_m), os.path.join(OUT, 'tray-u.webp'), 88, rgba=True)
webp(aligner(lower_m), os.path.join(OUT, 'tray-l.webp'), 88, rgba=True)

# how far each waits in front of its teeth before it is pushed on: the gap
# between the arches at the middle (a fraction of the jaw box's height)
tu, tl = teeth_in(Eo, upper_m), teeth_in(Eo, lower_m)
mid = range((JB[0] + JB[2]) // 2 - 60, (JB[0] + JB[2]) // 2 + 60)
up_bottom = np.mean([np.nonzero(tu[:, x])[0].max() for x in mid if tu[:, x].any()])
up_top = np.mean([np.nonzero(tu[:, x])[0].min() for x in mid if tu[:, x].any()])
lo_top = np.mean([np.nonzero(tl[:, x])[0].min() for x in mid if tl[:, x].any()])
lo_bottom = np.mean([np.nonzero(tl[:, x])[0].max() for x in mid if tl[:, x].any()])
gap = (lo_top - up_bottom) / (JB[3] - JB[1])


# ---------- the scan: dots and wireframe over the crooked teeth ----------
def mk(alpha8, rgb=ICE):
    return ink(alpha8.astype(np.float32), rgb).astype(np.uint8)


tA = cut(teeth_in(A, mask), MB)
g = cv2.GaussianBlur(cv2.cvtColor(cut(A, MB), cv2.COLOR_BGR2GRAY), (0, 0), 1.6)
e = cv2.Canny(g, 22, 60)
e[cv2.dilate(tA, np.ones((7, 7), np.uint8)) == 0] = 0
mesh = mk(cv2.GaussianBlur(cv2.dilate(e, np.ones((2, 2), np.uint8)), (0, 0), 0.7))
webp(mesh, os.path.join(OUT, 'mesh.webp'), 90, rgba=True)
gl = g.astype(np.float32) / 255
pts = np.zeros(g.shape, np.float32)
step = 7
for row, y in enumerate(range(step // 2, g.shape[0], step)):
    for x in range(step // 2 + (row % 2) * step // 2, g.shape[1], step):
        if tA[y, x]:
            cv2.circle(pts, (x * 4, y * 4), int((0.9 + 1.6 * gl[y, x] ** 2) * 4), 1.0, -1, cv2.LINE_AA, 2)
points = mk((pts * 255).astype(np.uint8))
webp(points, os.path.join(OUT, 'points.webp'), 88, rgba=True)

# the glint's mask: the teeth under the closed aligners, soft-edged
tD = cv2.GaussianBlur(cv2.dilate(cut(teeth_in(D, mask), JB), np.ones((5, 5), np.uint8)), (0, 0), 2)
webp(mk(tD, (255, 255, 255)), os.path.join(OUT, 'teeth.webp'), 80, rgba=True)


# ---------- stills: the share picture and the chapter pictures ----------
def lay(base, layer, k=1.0):
    al = layer[..., 3:4].astype(np.float32) / 255 * k
    return (base.astype(np.float32) * (1 - al) + layer[..., :3].astype(np.float32) * al).astype(np.uint8)


def dim(im):
    return (im.astype(np.float32) * 0.82 + np.array(FIELD[::-1], np.float32) * 0.18).astype(np.uint8)


def chapter_still(full, name):
    cx, cy = (JB[0] + JB[2]) // 2, (MB[1] + MB[3]) // 2 + 30
    w = int((MB[2] - MB[0]) * 1.7); h = w * 2 // 3
    webp(full[cy - h // 2:cy + h // 2, cx - w // 2:cx + w // 2], os.path.join(STILLS, name), 82, (900, 600))


def with_box(base, bx, part):
    im = base.copy(); im[bx[1]:bx[3], bx[0]:bx[2]] = part
    return im


scan = dim(A); scan[MB[1]:MB[3], MB[0]:MB[2]] = lay(lay(dim(cut(A, MB)), points), mesh, 0.8)
chapter_still(scan, 'scan.webp')
chapter_still(with_box(A, MB, plan[PLAN_STEPS // 2]), 'plan.webp')
chapter_still(with_box(E, JB, tray[4]), 'aligner.webp')
top = max(0, min(H - W, (MB[1] + MB[3]) // 2 - W // 2 - 80))
webp(hand[top:top + W, :], os.path.join(STILLS, 'result.webp'), 82, (900, 900))


def wide(im, w, h, name, q=80):
    canvas = np.zeros((h, w, 3), np.uint8); canvas[:] = FIELD[::-1]
    fw = round(W * h / H)
    face = cv2.resize(im, (fw, h), interpolation=cv2.INTER_AREA).astype(np.float32)
    x = w - fw - round(w * 0.04)
    ramp_w = round(fw * 0.22)
    al = np.ones((h, fw, 1), np.float32); al[:, :ramp_w, 0] = np.linspace(0, 1, ramp_w)[None, :]
    canvas[:, x:x + fw] = (face * al + canvas[:, x:x + fw] * (1 - al)).astype(np.uint8)
    webp(canvas, os.path.join(STILLS, name), q)


wide(A, 1600, 900, 'hero.webp')
wide(A, 960, 540, 'hero-960.webp')
webp(A, os.path.join(STILLS, 'hero-tall.webp'), 80, (900, 1200))

# ---------- numbers for js/site.js ----------
# tags: the labelled teeth (face-tags.json) and the two aligners, pinned to
# the middle of each arch's front teeth in the open bite
anchors = {k: v for k, v in json.load(open(os.path.join(SRC, 'face-tags.json'))).items() if k not in ('u', 'l')}
mx = (JB[0] + JB[2]) // 2
anchors['u'] = [mx, int(round((up_top + up_bottom) / 2))]
anchors['l'] = [mx, int(round((lo_top + lo_bottom) / 2))]
frac = lambda bx: [round(bx[0] / W, 4), round(bx[1] / H, 4), round((bx[2] - bx[0]) / W, 4), round((bx[3] - bx[1]) / H, 4)]
print('\nFACE =', json.dumps({
    'w': W, 'h': H, 'mouth': frac(MB), 'jaw': frac(JB),
    'plan': len(plan), 'tray': len(tray), 'gap': round(float(gap), 4),
    'tags': {k: [round(x / W, 4), round(y / H, 4)] for k, (x, y) in anchors.items()},
}))
