"""Overlay current blast origin guesses on fire sprites and estimate palm pixels."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

SPR = Path(__file__).resolve().parents[1] / "assets" / "sprites"
OUT = Path(__file__).resolve().parents[1] / "tools" / "_hands"

# current game fractions
CUR = {
    "goku_ui_fire.png": (0.88, 0.33, 0.84, 0.33, 0.93, 0.33),
    "vegeta_ue_fire.png": (0.86, 0.40, 0.80, 0.38, 0.92, 0.40),
    "gohan_beast_fire.png": (0.88, 0.18, 0.86, 0.16, 0.90, 0.20),
    "legend_fire.png": (0.82, 0.32, 0.78, 0.30, 0.86, 0.34),
    "sbroly_legend_fire.png": (0.84, 0.32, 0.76, 0.32, 0.92, 0.32),
    "black_rose_fire.png": (0.82, 0.34, 0.74, 0.34, 0.90, 0.34),
    "cell_cultra_fire.png": (0.84, 0.31, 0.80, 0.28, 0.88, 0.34),
    "frieza_fblack_fire.png": (0.91, 0.25, 0.89, 0.25, 0.93, 0.25),
    "buu_kid_fire.png": (0.70, 0.36, 0.62, 0.36, 0.78, 0.36),
}

OUT.mkdir(exist_ok=True)

def mark(name, hx, hy, h1x, h1y, h2x, h2y):
    im = Image.open(SPR / name).convert("RGBA")
    w, h = im.size
    vis = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    vis.alpha_composite(im)
    d = ImageDraw.Draw(vis)
    pts = [
        ((hx * w, hy * h), (255, 40, 40, 255), 18),
        ((h1x * w, h1y * h), (40, 255, 80, 255), 12),
        ((h2x * w, h2y * h), (40, 255, 80, 255), 12),
    ]
    for (x, y), col, r in pts:
        d.ellipse((x - r, y - r, x + r, y + r), outline=col, width=4)
        d.line((x - 22, y, x + 22, y), fill=col, width=3)
        d.line((x, y - 22, x, y + 22), fill=col, width=3)
    vis.convert("RGB").save(OUT / name.replace(".png", "_mark.jpg"), quality=85)
    print(name, w, h)

for n, vals in CUR.items():
    mark(n, *vals)
print("wrote", OUT)
