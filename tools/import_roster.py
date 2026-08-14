"""Copia sprites novos do cache do Cursor, duplica idle como charge e recorta o fundo verde."""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).parent))
from process_sprites import process

SRC = Path(r"C:\Users\Usuário\.cursor\projects\c-Users-Usu-rio-Downloads-Thomas-THOMAS-projetos-Broly\assets")
DST = ROOT / "assets" / "sprites"

PREFIXES = ("goku_", "vegeta_", "black_", "gohan_", "frieza_")

DST.mkdir(parents=True, exist_ok=True)
copied = []
for src in SRC.glob("*.png"):
    if not src.name.startswith(PREFIXES):
        continue
    dest = DST / src.name
    shutil.copy2(src, dest)
    copied.append(dest)
    if src.name.endswith("_idle.png"):
        charge = DST / src.name.replace("_idle.png", "_charge.png")
        if not charge.exists():
            shutil.copy2(src, charge)
            copied.append(charge)

for p in copied:
    process(p)
print("done", len(copied))
