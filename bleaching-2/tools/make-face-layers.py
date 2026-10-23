# python3 tools/make-face-layers.py <source.png> [outDir]
#
# Builds the hero's treatment layers from ONE photo of a man smiling with
# white teeth (AI portrait, Higgsfield soul_2, 2048x2048). Every layer comes
# from the same pixels, so they sit exactly on his teeth:
#   face.webp / face-1200.webp  the whole photo, teeth tinted yellow (A3.5): the start
#   face-white.webp             the mouth, his own white teeth, alpha = the teeth mask
#   face-barrier.webp           the mouth, the gum barrier (teal resin over the upper gum)
#   face-gel.webp               the mouth, the whitening gel (glossy, translucent)
#   step-1…5.webp               stills of the five steps, for visitors without the scroll scene
# The mouth box (MOUTH) and the teeth/gum thresholds were set by eye on this
# photo; check tools/face-check.jpg after a run.
import os, sys
import cv2
import numpy as np

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'assets', 'photos', 'face')
os.makedirs(out, exist_ok=True)

im = cv2.imread(src)                      # BGR, 2048x2048
H, W = im.shape[:2]
X0, Y0, X1, Y1 = 760, 1180, 1320, 1460    # the mouth box in the photo
ELLIPSE = ((265, 135), (215, 72))         # the lip opening, in mouth-box pixels

crop = im[Y0:Y1, X0:X1].copy()
h, w = crop.shape[:2]
lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
L = lab[..., 0] * 100 / 255
A = lab[..., 1] - 128
B = lab[..., 2] - 128
opening = np.zeros((h, w), np.uint8)
cv2.ellipse(opening, ELLIPSE[0], ELLIPSE[1], 0, 0, 360, 255, -1)


def biggest(mask, min_area):
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(mask)
    keep = np.zeros_like(mask)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > min_area:
            keep[lbl == i] = 255
    return keep


# ---- the teeth: light, hardly red, not very yellow, inside the lips
teeth = ((L > 42) & (A < 10) & (B < 24) & (opening > 0)).astype(np.uint8) * 255
teeth = cv2.morphologyEx(teeth, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
teeth = cv2.morphologyEx(teeth, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
teeth = biggest(teeth, 150)
soft = cv2.GaussianBlur(teeth.astype(np.float32) / 255, (0, 0), 1.4)

# top edge of the teeth per column (the gum line on the upper row)
top = np.full(w, h, np.float32)
for x in range(w):
    col = np.where(teeth[:, x] > 0)[0]
    if len(col):
        top[x] = col.min()
ys = np.arange(h, dtype=np.float32)[:, None].repeat(w, 1)

# ---- yellow (A3.5): warmer and darker, strongest at the gum line and on the lower row
near_gum = np.clip(1 - (ys - top[None, :]) / 45.0, 0, 1)
lower = np.clip((ys - 160) / 30.0, 0, 1)
k = soft * (0.85 + 0.35 * near_gum + 0.15 * lower)
ylab = np.dstack([np.clip((L - 9 * k) * 255 / 100, 0, 255), np.clip(A + 5 * k + 128, 0, 255), np.clip(B + 19 * k + 128, 0, 255)]).astype(np.uint8)
yellow = cv2.cvtColor(ylab, cv2.COLOR_LAB2BGR)

# ---- the gum barrier: the pink gum above the upper teeth, plus a hair over the tooth edge
gum = ((A > 6) & (A < 30) & (L > 50) & (ys < top[None, :] + 3) & (opening > 0)).astype(np.uint8) * 255
gum = cv2.morphologyEx(gum, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
gum = biggest(gum, 300)
band = ((ys >= top[None, :] - 2) & (ys <= top[None, :] + 4) & (top[None, :] < h) & (ys < 150)).astype(np.uint8) * 255
barrier = cv2.bitwise_or(gum, band)
barrier = cv2.morphologyEx(barrier, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
barrier = cv2.bitwise_and(barrier, opening)
# only the band right above the teeth: drops specks of light on the upper lip
barrier[(ys < top[None, :] - 26) | (ys > top[None, :] + 6)] = 0
barrier = biggest(barrier, 400)
bsoft = cv2.GaussianBlur(barrier.astype(np.float32) / 255, (0, 0), 1.6)
shade = cv2.GaussianBlur(L, (0, 0), 3) / 100            # keep the light and shadow of the mouth
resin = np.array([208, 184, 72], np.float32)            # BGR of a teal resin (#48b8d0)
bar_rgb = np.clip(resin[None, None, :] * (0.55 + 0.6 * shade[..., None]), 0, 255)
bar_alpha = np.clip(bsoft * 0.94, 0, 1)

# ---- the gel: translucent mint-blue over the teeth (a little wider), with gloss
gel_mask = cv2.dilate(teeth, np.ones((5, 5), np.uint8))
gsoft = cv2.GaussianBlur(gel_mask.astype(np.float32) / 255, (0, 0), 2.0)
hi = np.clip((L - cv2.GaussianBlur(L, (0, 0), 6)) / 10, 0, 1)   # small bright details become gloss
tint = np.array([214, 226, 128], np.float32)            # BGR of a mint-teal gel (#80e2d6)
gel_rgb = np.clip(tint[None, None, :] * (0.7 + 0.35 * shade[..., None]) + 255 * hi[..., None] * 0.3, 0, 255)
gel_alpha = np.clip(gsoft * (0.52 + 0.25 * hi), 0, 1)


def rgba(bgr, alpha):
    return np.dstack([bgr.astype(np.uint8), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])


def save(path, img, q=82):
    cv2.imwrite(path, img, [cv2.IMWRITE_WEBP_QUALITY, q])


face = im.copy()
face[Y0:Y1, X0:X1] = yellow
save(os.path.join(out, 'face.webp'), face, 80)
save(os.path.join(out, 'face-1200.webp'), cv2.resize(face, (1200, 1200), interpolation=cv2.INTER_AREA), 80)
save(os.path.join(out, 'face-white.webp'), rgba(crop, soft), 90)
save(os.path.join(out, 'face-barrier.webp'), rgba(bar_rgb, bar_alpha), 90)
save(os.path.join(out, 'face-gel.webp'), rgba(gel_rgb, gel_alpha), 90)


# ---- stills for the step list: the mouth close-up at each step
def over(base, rgb, alpha, k=1.0):
    a = (alpha * k)[..., None]
    return base * (1 - a) + rgb * a


def still(n, barrier_k, gel_k, white_k, lamp_k):
    m = yellow.astype(np.float32)
    m = over(m, crop.astype(np.float32), soft, white_k)
    m = over(m, bar_rgb, bar_alpha, barrier_k)
    m = over(m, gel_rgb, gel_alpha, gel_k)
    if lamp_k:
        glow = np.zeros((h, w), np.float32)
        cv2.ellipse(glow, ELLIPSE[0], (230, 95), 0, 0, 360, 1, -1)
        glow = cv2.GaussianBlur(glow, (0, 0), 30) * lamp_k
        m = m + np.array([255, 140, 110], np.float32)[None, None, :] * glow[..., None] * 0.16
    full = face.astype(np.float32).copy()
    full[Y0:Y1, X0:X1] = m
    cx, cy, half = (X0 + X1) // 2, (Y0 + Y1) // 2, 520
    tile = np.clip(full[cy - half:cy + half, cx - half:cx + half], 0, 255).astype(np.uint8)
    save(os.path.join(out, f'step-{n}.webp'), cv2.resize(tile, (900, 900), interpolation=cv2.INTER_AREA), 80)


still(1, 0, 0, 0, 0)
still(2, 1, 0, 0, 0)
still(3, 1, 1, 0, 0)
still(4, 1, 1, 0.55, 1)
still(5, 0, 0, 1, 0)

check = np.hstack([cv2.resize(yellow, (w * 2, h * 2)), cv2.resize(crop, (w * 2, h * 2))])
cv2.imwrite(os.path.join(os.path.dirname(__file__), 'face-check.jpg'), check, [cv2.IMWRITE_JPEG_QUALITY, 85])
print('mouth box', (X0, Y0, X1, Y1), 'of', (W, H), '→', out)
