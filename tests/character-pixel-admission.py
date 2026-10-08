#!/usr/bin/env python3
"""Self-contained pixel gate smoke tests. Requires Pillow."""
import importlib.util
import json
import pathlib
import tempfile
from PIL import Image

root = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("gate", root / "tools/validate-character-pixels.py")
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

with tempfile.TemporaryDirectory() as tmp:
    folder = pathlib.Path(tmp)
    manifest = {
        "rigVersion": 1, "zone": "torso", "variant": "custode-test",
        "file": "torso.png", "origin": {"x": 325, "y": 360},
        "nativeSize": {"width": 374, "height": 480},
        "overlapZones": []
    }
    img = Image.new("RGBA", (374, 480), (0, 0, 0, 0))
    for y in range(20, 200):
        for x in range(20, 200):
            img.putpixel((x, y), (90, 90, 90, 255))
    img.save(folder / "torso.png")
    assert gate.inspect(manifest, folder)["ok"]
    img.putpixel((0, 0), (255, 255, 255, 1))
    # With same native dimensions, the top-left pixel is still within torso.
    img.save(folder / "torso.png")
    assert gate.inspect(manifest, folder)["ok"]
    manifest["origin"] = {"x": 0, "y": 0}
    rejected = gate.inspect(manifest, folder)
    assert not rejected["ok"] and rejected["outOfZonePixels"] > 0
    manifest["origin"] = {"x": 325, "y": 360}
    img = Image.new("RGB", (374, 480), (80, 80, 80))
    img.save(folder / "torso.png")
    assert "no alpha channel" in gate.inspect(manifest, folder)["errors"]
    img = Image.new("RGBA", (374, 480), (0, 0, 0, 0))
    img.save(folder / "torso.png")
    assert "image fully transparent" in gate.inspect(manifest, folder)["errors"]
print("PASS Character Rig v1 pixel admission smoke tests")
