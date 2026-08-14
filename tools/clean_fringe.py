"""Remove franja de chroma verde e fundo preto, sem recortar de novo."""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SPR = ROOT / "assets" / "sprites"


def knock_black(path: Path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].astype(np.int16)
    bright = rgb.mean(axis=2)
    dark = bright < 32
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

    kill = np.zeros((h, w), dtype=np.bool_)
    while q:
        x, y = q.popleft()
        if not dark[y, x]:
            vis[y, x] = False
            continue
        kill[y, x] = True
        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)

    alpha = arr[:, :, 3].astype(np.int16)
    alpha = np.where(kill, 0, alpha)
    soft = Image.fromarray(alpha.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.6))
    arr[:, :, 3] = np.minimum(alpha, np.array(soft)).astype(np.uint8)
    Image.fromarray(arr, "RGBA").save(path)
    print(f"black {path.name}")


def knock_green(path: Path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img).astype(np.int16)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    chroma = (g > 128) & (g > r + 40) & (g > b + 34) & (r < 145) & (a > 4)
    yellow = (r > 150) & (g > 140) & (np.abs(r - g) < 70)
    pink = (r > 160) & (b > 80) & (r > g)
    remove = chroma & (~yellow) & (~pink)
    mask = Image.fromarray((remove.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(3))
    kill = np.array(mask) > 40
    arr[:, :, 3] = np.where(kill, 0, a)
    Image.fromarray(arr.astype(np.uint8), "RGBA").save(path)
    print(f"green {path.name} -{int(kill.sum())}")


def main():
    for f in sorted(SPR.glob("*.png")):
        if f.name.startswith("legend"):
            continue
        knock_green(f)
    for name in ("legend_idle.png", "legend_charge.png"):
        p = SPR / name
        if p.exists():
            knock_black(p)


if __name__ == "__main__":
    main()
