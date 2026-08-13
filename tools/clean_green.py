"""Remove restos de chroma verde dos sprites ja recortados."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "sprites"


def clean(path: Path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img).astype(np.int16)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    chroma = (g > 105) & (g > r + 26) & (g > b + 18)
    warm = (r > 155) & (g > 110) & (r + 30 >= g) & (b < 150)
    skin = (r > 140) & (g > 90) & (b > 70) & (r > g) & (np.abs(r - g) < 80)
    remove = chroma & (~warm) & (~skin) & (a > 8)
    mask = Image.fromarray((remove.astype(np.uint8) * 255), "L")
    mask = mask.filter(ImageFilter.MaxFilter(3))
    kill = np.array(mask) > 40
    arr[:, :, 3] = np.where(kill, 0, a)
    out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    out.save(path)
    print(f"ok {path.name} removed {int(kill.sum())} px")


def main():
    for f in sorted(SRC.glob("*.png")):
        clean(f)


if __name__ == "__main__":
    main()
