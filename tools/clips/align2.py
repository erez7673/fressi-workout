"""Align an edited still B onto the base still A when the edit zoomed or shifted the scene.

usage: align2.py <A.png> <B.png> <box:x0,x1,y0,y1|all> <out.png> [ov.png]
Searches scale (0.85-1.15) and shift so the anchor box of A (fractions, the equipment that must stay put)
matches B, then writes B warped onto A's frame (576x576). ov.png = A | B aligned | 50% overlay.
"""
import sys
import numpy as np
from PIL import Image

N = 576


def load(p):
    return Image.open(p).convert('RGB').resize((N, N), Image.LANCZOS)


def warp(img, s, dx, dy, n=N):
    # output pixel (x,y) takes B at ((x - cx)*s + cx + dx, (y - cy)*s + cy + dy)
    c = n / 2
    return img.transform((n, n), Image.AFFINE, (s, 0, c - c * s + dx, 0, s, c - c * s + dy),
                         resample=Image.BICUBIC, fillcolor=(28, 28, 30) if img.mode == 'RGB' else 28)


def main():
    A, B = load(sys.argv[1]), load(sys.argv[2])
    spec, out = sys.argv[3], sys.argv[4]
    if spec == 'all':
        box = (0, N, 0, N)
    else:
        f = [float(v) for v in spec.split(':', 1)[1].split(',')]
        box = (int(f[0] * N), int(f[1] * N), int(f[2] * N), int(f[3] * N))
    q = 4  # coarse search on a quarter-size image
    ga = np.asarray(A.convert('L').resize((N // q, N // q)), dtype=np.float32)
    x0, x1, y0, y1 = [v // q for v in box]
    Bs = B.convert('L').resize((N // q, N // q), Image.LANCZOS)
    best = None
    for s in np.arange(0.85, 1.151, 0.01):
        for dx in range(-60, 61, 4):
            for dy in range(-60, 61, 4):
                w = np.asarray(warp(Bs, s, dx / q, dy / q, N // q), dtype=np.float32)
                e = np.abs(w[y0:y1, x0:x1] - ga[y0:y1, x0:x1]).mean()
                if best is None or e < best[0]:
                    best = (e, s, dx, dy)
    e, s, dx, dy = best
    gA = np.asarray(A.convert('L'), dtype=np.float32)
    for s2 in np.arange(s - 0.01, s + 0.0101, 0.0025):  # fine search at full size
        for dx2 in range(dx - 4, dx + 5):
            for dy2 in range(dy - 4, dy + 5):
                w = np.asarray(warp(B, s2, dx2, dy2).convert('L'), dtype=np.float32)
                e2 = np.abs(w[box[2]:box[3], box[0]:box[1]] - gA[box[2]:box[3], box[0]:box[1]]).mean()
                if e2 < best[0]:
                    best = (e2, s2, dx2, dy2)
    e, s, dx, dy = best
    R = warp(B, s, dx, dy)
    R.save(out)
    print(f'scale={s:.4f} dx={dx} dy={dy} err={e:.1f}')
    if len(sys.argv) > 5:
        a, b = A.resize((320, 320)), R.resize((320, 320))
        sheet = Image.new('RGB', (960, 320))
        for k, i in enumerate((a, b, Image.blend(a, b, 0.5))):
            sheet.paste(i, (320 * k, 0))
        sheet.save(sys.argv[5])


if __name__ == '__main__':
    main()
