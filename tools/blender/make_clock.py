"""Render the brass wall clock face (no hands) in the left-wall plane.

    Blender -b --python tools/blender/make_clock.py

The sprite is centred on the dial. Hands stay live in Pixi (studioDecor.ts
buildWallClock) so the clock can tick; they use the same wall-plane mapping.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from math import cos, radians, sin  # noqa: E402

from rst_iso import *  # noqa: E402,F401,F403

S = 112


def main():
    reset()
    lights(strength=3.0, ambient=0.8)
    brass = mat("brass", PAL["brass"], 0.3, metal=0.8)
    rim = mat("rim", 0x6B4A1C, 0.5)
    ring = mat("ring", 0x2A1F14, 0.6)
    face = mat("face", 0xF3EAD6, 0.85)
    ink = mat("ink", 0x2B2118, 0.7)
    red = mat("hub", 0x8A2323, 0.5)
    R = 0.52
    # Axis along game +x (Blender Y): the dial faces into the room.
    cyl("bezel", G(0.05, 0, 0), R, 0.09, brass, 28, axis="Y", bevel=0.01)
    cyl("bezel_lip", G(0.098, 0, 0), R * 0.9, 0.02, rim, 28, axis="Y")
    cyl("ring", G(0.1, 0, 0), R * 0.86, 0.02, ring, 28, axis="Y")
    cyl("face", G(0.11, 0, 0), R * 0.8, 0.02, face, 28, axis="Y")
    for i in range(12):
        a = radians(i * 30)
        long_ = i % 3 == 0
        r0, r1 = R * 0.74, R * (0.52 if long_ else 0.6)
        rm, ln = (r0 + r1) / 2, r0 - r1
        t = box(f"tick{i}", G(0.125, -sin(a) * rm, cos(a) * rm), (0.035 if long_ else 0.018, 0.012, ln), ink, 0.002,
                rot=(0, -a, 0))
    cyl("hub", G(0.14, 0, 0), 0.04, 0.03, red, 10, axis="Y")
    setup_render(S, S, (S // 2, S // 2), samples=32)
    render(out_path("clock_face.png"))
    write_json(out_path("clock.json"), {"size": [S, S], "anchor": [S // 2, S // 2], "scale": 0.5, "radiusU": R})


main()
