"""Remove fundo dos sprites e recorta o conteudo visivel."""
from pathlib import Path
from collections import deque
from PIL import Image, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "sprites"


def process(path: Path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].astype(np.int16)

    corners = np.vstack(
        [
            rgb[2, 2],
            rgb[2, w - 3],
            rgb[h - 3, 2],
            rgb[h - 3, w - 3],
            rgb[2, w // 2],
            rgb[h // 2, 2],
            rgb[h // 2, w - 3],
            rgb[h - 3, w // 2],
        ]
    )
    ref = corners.mean(axis=0)
    ref_b = ref.mean()

    dist = np.sqrt(((rgb - ref) ** 2).sum(axis=2))
    bright = rgb.mean(axis=2)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    chroma = (g > 140) & (g > r + 25) & (g > b + 25)
    keep_aura = (bright > ref_b + 42) & (~chroma)
    similar = (dist < 58) | chroma
    candidate = similar & (~keep_aura)

    mask = np.zeros((h, w), dtype=np.uint8)
    vis = np.zeros((h, w), dtype=np.bool_)
    q = deque()

    def push(x, y):
        if x < 0 or y < 0 or x >= w or y >= h or vis[y, x]:
            return
        vis[y, x] = True
        q.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while q:
        x, y = q.popleft()
        if not candidate[y, x]:
            vis[y, x] = False
            continue
        mask[y, x] = 1
        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)

    alpha = np.where(mask == 1, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode="L")
    soft = alpha_img.filter(ImageFilter.GaussianBlur(3.2))
    soft_arr = np.array(soft)
    # Keep fully opaque interior, only feather near edges
    alpha = np.minimum(alpha, soft_arr)

    yy, xx = np.ogrid[:h, :w]
    nx = (xx - w * 0.5) / (w * 0.46)
    ny = (yy - h * 0.52) / (h * 0.48)
    d = np.sqrt(nx * nx + ny * ny)
    fade = np.clip(1.0 - (d - 1.02) / 0.24, 0, 1)
    alpha = (alpha.astype(np.float32) * fade).astype(np.uint8)

    arr[:, :, 3] = alpha
    out = Image.fromarray(arr, "RGBA")

    ys, xs = np.where(alpha > 18)
    if len(xs):
        pad = 20
        left = max(0, int(xs.min()) - pad)
        top = max(0, int(ys.min()) - pad)
        right = min(w, int(xs.max()) + pad + 1)
        bottom = min(h, int(ys.max()) + pad + 1)
        out = out.crop((left, top, right, bottom))

    out.save(path)
    print(f"ok {path.name} {out.size}")


def main():
    for f in sorted(SRC.glob("*.png")):
        process(f)


if __name__ == "__main__":
    main()
