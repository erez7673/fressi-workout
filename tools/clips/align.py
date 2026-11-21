"""Split a side-by-side keyframe pair, align the right frame to the left one, write square stills.

usage:
  align.py find  <pair.png> <anchor> <dxlo> <dxhi>      -> prints the best dx,dy and the 3 best local minima
  align.py make  <pair.png> <out_prefix> <dx> <dy>      -> <out>-a.png, <out>-b.png (576x576), <out>-ov.png
anchor: feet            (bright pixels in the lowest 45 px of the left frame)
        box:x0,x1,y0,y1 (fractions of the left frame)
        all             (whole frame)
dx/dy = where the anchor content of A sits in B, relative to A (B content = A content shifted by dx,dy).
"""
import sys
import numpy as np
from PIL import Image


def halves(path):
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    w = im.shape[1] // 2
    return im[:, :w], im[:, w:2 * w]


def gray(a):
    return a.mean(axis=2)


def anchor_box(A, spec):
    g = gray(A)
    h, w = g.shape
    if spec == 'all':
        return 20, w - 20, 20, h - 20
    if spec == 'feet':
        rows = np.where((g > 90).any(axis=1))[0]
        y1 = rows.max() + 6
        y0 = y1 - 50
        cols = np.where((g[y0:y1] > 90).any(axis=0))[0]
        return max(cols.min() - 12, 0), min(cols.max() + 12, w), y0, min(y1, h)
    x0, x1, y0, y1 = [float(v) for v in spec.split(':', 1)[1].split(',')]
    return int(x0 * w), int(x1 * w), int(y0 * h), int(y1 * h)


def find(path, spec, lo, hi):
    A, B = halves(path)
    ga, gb = gray(A), gray(B)
    x0, x1, y0, y1 = anchor_box(A, spec)
    t = ga[y0:y1, x0:x1]
    h, w = gb.shape
    res = []
    for dx in range(lo, hi + 1, 2):
        best = None
        for dy in range(-12, 13, 2):
            if x0 + dx < 0 or x1 + dx > w or y0 + dy < 0 or y1 + dy > h:
                continue
            s = np.abs(gb[y0 + dy:y1 + dy, x0 + dx:x1 + dx] - t).mean()
            if best is None or s < best[0]:
                best = (s, dy)
        if best:
            res.append((best[0], dx, best[1]))
    res.sort()
    print('anchor box', (x0, x1, y0, y1))
    shown = []
    for s, dx, dy in res:
        if all(abs(dx - d) > 20 for _, d, _ in shown):
            shown.append((s, dx, dy))
        if len(shown) == 3:
            break
    for s, dx, dy in shown:
        print(f'dx={dx} dy={dy} sad={s:.1f}')


def make(path, out, dx, dy):
    A, B = halves(path)
    h, w = A.shape[:2]
    # B content sits at A position + (dx,dy); shift B back by (-dx,-dy) onto a padded canvas
    px, py = abs(dx) + 4, abs(dy) + 4
    pa = np.pad(A, ((py, py), (px, px), (0, 0)), mode='edge')
    pb = np.pad(B, ((py, py), (px, px), (0, 0)), mode='edge')
    pb = np.roll(pb, (-dy, -dx), axis=(0, 1))
    # union of bright content
    m = (gray(pa) > 70) | (gray(pb) > 70)
    ys, xs = np.where(m)
    cx = (xs.min() + xs.max()) // 2
    side = max(h, xs.max() - xs.min() + 80, ys.max() - ys.min() + 80)
    H, W = pa.shape[:2]
    extra_y = max(0, side - H)
    extra_x = max(0, side - W)
    padw = ((extra_y // 2 + 1, extra_y // 2 + 1), (extra_x // 2 + 1, extra_x // 2 + 1), (0, 0))
    pa, pb = np.pad(pa, padw, mode='edge'), np.pad(pb, padw, mode='edge')
    cx += extra_x // 2 + 1
    H, W = pa.shape[:2]
    cy = (ys.min() + ys.max()) // 2 + extra_y // 2 + 1
    xa = min(max(cx - side // 2, 0), W - side)
    ya = min(max(cy - side // 2, 0), H - side)
    imgs = []
    for arr, tag in ((pa, 'a'), (pb, 'b')):
        c = arr[ya:ya + side, xa:xa + side].clip(0, 255).astype(np.uint8)
        im = Image.fromarray(c).resize((576, 576), Image.LANCZOS)
        im.save(f'{out}-{tag}.png')
        imgs.append(im)
    a, b = [i.resize((320, 320)) for i in imgs]
    ov = Image.blend(a, b, 0.5)
    sheet = Image.new('RGB', (960, 320))
    for k, i in enumerate((a, b, ov)):
        sheet.paste(i, (320 * k, 0))
    sheet.save(f'{out}-ov.png')
    print('side', side)


if __name__ == '__main__':
    if sys.argv[1] == 'find':
        find(sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]))
    else:
        make(sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]))
