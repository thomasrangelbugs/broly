"""Recupera pernas transparentes sem reabrir o fundo preto."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

SPR = Path(__file__).resolve().parents[1] / "assets" / "sprites"


def restore(path: Path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.int16)
    a = arr[:, :, 3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    bright = rgb.mean(axis=2)
    h, w = a.shape
    y0 = int(h * 0.42)
    body = np.zeros((h, w), dtype=bool)
    body[y0:, :] = True
    cloth = (
        ((r > 55) & (g > 55) & (b > 50))
        | ((r > 80) & (g > 50) & (r >= b))
        | ((r > 70) & (r > g + 15) & (r > b))
        | ((g > 70) & (g > r) & (g > b))
    )
    holes = body & cloth & (bright > 20) & (a < 210)
    a = np.where(holes, 255, a)
    solid = Image.fromarray((a > 80).astype(np.uint8) * 255, "L")
    filled = solid.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
    close = np.array(filled) > 40
    a = np.where(body & close & (bright > 18) & (a < 40), 255, a)
    arr[:, :, 3] = a.astype(np.uint8)
    Image.fromarray(arr, "RGBA").save(path)
    print(path.name, int(holes.sum()))


def main():
    for name in ("legend_idle.png", "legend_charge.png", "rose_idle.png", "rose_charge.png"):
        p = SPR / name
        if p.exists():
            restore(p)


if __name__ == "__main__":
    main()
