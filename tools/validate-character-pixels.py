#!/usr/bin/env python3
"""Nymeria Character Rig v1 pixel admission gate. Requires Pillow.

Usage: python3 tools/validate-character-pixels.py manifest.json
Run the structural Node validator separately. This script never edits source images.
"""
import json
import pathlib
import sys
from PIL import Image

CANVAS = (1024, 1536)
ZONES = {
    "back": (270, 330, 484, 840),
    "legs": (355, 810, 314, 530),
    "feet": (325, 1290, 374, 150),
    "torso": (325, 360, 374, 480),
    "arms": (215, 390, 594, 540),
    "waist": (325, 790, 374, 120),
    "head": (380, 120, 264, 265),
    "offHand": (130, 660, 260, 420),
    "mainHand": (735, 530, 160, 710),
}

def inspect(manifest, base):
    errors = []
    if manifest.get("rigVersion") != 1:
        errors.append("wrong rigVersion")
    zone = manifest.get("zone")
    if zone not in ZONES:
        return {"ok": False, "errors": errors + ["unknown zone"]}
    permitted = [zone] + manifest.get("overlapZones", [])
    if not isinstance(permitted, list) or any(z not in ZONES for z in permitted):
        return {"ok": False, "errors": errors + ["invalid overlapZones"]}
    file = manifest.get("file")
    if not isinstance(file, str) or not file.lower().endswith(".png"):
        return {"ok": False, "errors": errors + ["pixel gate currently supports PNG only"]}
    root = base.resolve()
    source = (root / file).resolve()
    if not source.is_relative_to(root):
        return {"ok": False, "errors": errors + ["file outside manifest directory"]}
    try:
        with Image.open(source) as im:
            if im.format != "PNG":
                errors.append("not PNG")
            if im.mode not in ("RGBA", "LA") and "transparency" not in im.info:
                errors.append("no alpha channel")
            native = manifest.get("nativeSize", {})
            if im.size != (native.get("width"), native.get("height")):
                errors.append("nativeSize mismatch")
            origin = manifest.get("origin", {})
            ox, oy = origin.get("x"), origin.get("y")
            if not isinstance(ox, int) or not isinstance(oy, int):
                return {"ok": False, "errors": errors + ["invalid origin"]}
            if ox < 0 or oy < 0 or ox + im.width > CANVAS[0] or oy + im.height > CANVAS[1]:
                errors.append("image rectangle exceeds canvas")
            alpha = im.convert("RGBA").getchannel("A")
            bounds = alpha.getbbox()
            if bounds is None:
                errors.append("image fully transparent")
                return {"ok": False, "errors": errors, "alphaBounds": None}
            # Use actual nonzero alpha: faint background haze is NOT ignored.
            px = alpha.load()
            out = 0
            for y in range(im.height):
                for x in range(im.width):
                    if px[x, y] == 0:
                        continue
                    gx, gy = ox + x, oy + y
                    if not any(bx <= gx < bx + bw and by <= gy < by + bh
                               for z in permitted for bx, by, bw, bh in [ZONES[z]]):
                        out += 1
            if out:
                errors.append(f"{out} visible pixels outside permitted zones")
            return {"ok": not errors, "errors": errors,
                    "alphaBounds": [bounds[0]+ox, bounds[1]+oy, bounds[2]+ox, bounds[3]+oy],
                    "outOfZonePixels": out}
    except (OSError, ValueError, TypeError, AttributeError) as exc:
        return {"ok": False, "errors": errors + [f"cannot decode image: {exc}"]}

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 tools/validate-character-pixels.py manifest.json", file=sys.stderr)
        return 2
    path = pathlib.Path(sys.argv[1]).resolve()
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
        result = inspect(manifest, path.parent)
    except (OSError, ValueError) as exc:
        result = {"ok": False, "errors": [str(exc)]}
    print(json.dumps(result, indent=2))
    return 0 if result["ok"] else 1

if __name__ == "__main__":
    sys.exit(main())
