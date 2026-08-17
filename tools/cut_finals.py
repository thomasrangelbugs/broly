"""Recorta so rose (chroma verde) e legend (fundo preto), protegendo pernas."""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

SPR = Path(__file__).resolve().parents[1] / "assets" / "sprites"


def flood_kill(candidate):
    h, w = candidate.shape
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
        if not candidate[y, x]:
            vis[y, x] = False
            continue
        kill[y, x] = True
        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)
    return kill


def crop_alpha(arr):
    a = arr[:, :, 3]
    ys, xs = np.where(a > 18)
    if not len(xs):
        return arr
    pad = 16
    h, w = a.shape
    left = max(0, int(xs.min()) - pad)
    top = max(0, int(ys.min()) - pad)
    right = min(w, int(xs.max()) + pad + 1)
    bottom = min(h, int(ys.max()) + pad + 1)
    return arr[top:bottom, left:right]


def apply_kill(arr, kill):
    alpha = arr[:, :, 3].astype(np.int16)
    alpha = np.where(kill, 0, alpha)
    soft = Image.fromarray(alpha.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.2))
    arr[:, :, 3] = np.minimum(alpha, np.array(soft)).astype(np.uint8)
    return arr


def process_rose(path: Path):
    arr = np.array(Image.open(path).convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    chroma = (g > 130) & (g > r + 36) & (g > b + 30) & (r < 140)
    pink = (r > 150) & (b > 70) & (r > g)
    kill = flood_kill(chroma & (~pink))
    arr = apply_kill(arr, kill)
    Image.fromarray(crop_alpha(arr), "RGBA").save(path)
    print("rose", path.name)


def process_legend(path: Path):
    arr = np.array(Image.open(path).convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    bright = rgb.mean(axis=2)
    cloth = (
        ((r > 48) & (g > 48) & (b > 42))
        | ((r > 70) & (g > 45) & (r >= b - 8))
        | ((r > 60) & (r > g + 12))
        | ((g > 60) & (g >= r) & (g >= b))
    )
    bg = (bright < 22) & (~cloth)
    kill = flood_kill(bg)
    arr = apply_kill(arr, kill)
    Image.fromarray(crop_alpha(arr), "RGBA").save(path)
    print("legend", path.name)


def process_frieza(path: Path):
    """Knockout ALL chroma green, including pockets between tail/arms. Protect gold."""
    arr = np.array(Image.open(path).convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    a = arr[:, :, 3]
    gold = (r > 150) & (g > 120) & (g <= r + 8) & (np.abs(r.astype(np.int32) - g) < 70) & (b < 140)
    chroma = (g > 100) & (g > r + 10) & (g > b + 8) & (~gold)
    grow = np.array(Image.fromarray((chroma.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(3))) > 40
    kill = grow & (~gold)
    alpha = np.where(kill, 0, a)
    mx = np.maximum(r, b)
    spill = (alpha > 0) & (g > mx)
    arr[:, :, 1] = np.where(spill, mx, g).astype(np.uint8)
    eroded = np.array(Image.fromarray(alpha.astype(np.uint8), "L").filter(ImageFilter.MinFilter(3)))
    soft = Image.fromarray(eroded, "L").filter(ImageFilter.GaussianBlur(0.7))
    alpha = np.minimum(eroded, np.array(soft)).astype(np.uint8)
    arr[:, :, 3] = alpha
    dead = alpha < 12
    arr[:, :, 0] = np.where(dead, 0, arr[:, :, 0])
    arr[:, :, 1] = np.where(dead, 0, arr[:, :, 1])
    arr[:, :, 2] = np.where(dead, 0, arr[:, :, 2])
    Image.fromarray(crop_alpha(arr), "RGBA").save(path)
    print("frieza", path.name)


def knock_chroma_green(path: Path):
    """Remove leftover chroma green pockets without eating hair or gold."""
    arr = np.array(Image.open(path).convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    a = arr[:, :, 3]
    gold = (r > 150) & (g > 120) & (g <= r + 8) & (b < 140)
    chroma = (g > 125) & (g > r + 22) & (g > b + 20) & (~gold)
    alpha = np.where(chroma, 0, a)
    mx = np.maximum(r, b)
    spill = (alpha > 18) & (~gold) & (g > mx + 6)
    arr[:, :, 1] = np.where(spill, mx + 4, g).astype(np.uint8)
    arr[:, :, 3] = alpha.astype(np.uint8)
    Image.fromarray(arr, "RGBA").save(path)
    print("green", path.name, int(chroma.sum()))


def process_cell(path: Path):
    """Knockout only chroma magenta. Never key black armor, spots, or gems."""
    arr = np.array(Image.open(path).convert("RGBA"))
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    chroma = (r > 190) & (b > 170) & (g < 60) & ((r.astype(np.int32) + b) > g * 4)
    alpha = np.where(chroma, 0, 255).astype(np.uint8)
    soft = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(0.9))
    arr[:, :, 3] = np.minimum(alpha, np.array(soft))
    Image.fromarray(crop_alpha(arr), "RGBA").save(path)
    print("cell", path.name)


def main():
    rose = ["rose_idle.png", "rose_charge.png"]
    black = [
        "legend_idle.png", "legend_charge.png",
        "god_idle.png",
        "beast_idle.png", "beast_charge.png",
        "mystic_idle.png", "mystic_charge.png",
    ]
    for name in rose:
        p = SPR / name
        if p.exists():
            process_rose(p)
    for name in black:
        p = SPR / name
        if p.exists():
            process_legend(p)
    for p in sorted(SPR.glob("cell_*.png")):
        process_cell(p)
    for p in sorted(SPR.glob("frieza_*.png")):
        if "fblack" in p.name:
            process_cell(p)
        else:
            process_frieza(p)
    for p in sorted(SPR.glob("gohan_*.png")):
        knock_chroma_green(p)
    for p in sorted(SPR.glob("sbroly_*.png")):
        process_cell(p)


if __name__ == "__main__":
    main()
