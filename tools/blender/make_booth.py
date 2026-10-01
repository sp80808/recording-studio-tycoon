"""Render the vocal booth as two sprites: booth_back.png and booth_front.png.

    Blender -b --python tools/blender/make_booth.py

Footprint matches the room's booth: game tiles x 1.0..3.5, y 0..1.0 against the
right wall, glass front on y = 1.0. Sprite origin = game (2.25, 1.0) at floor level.
  * booth_back  : carpet, foam walls, mic on a boom arm + pop filter, stool, music stand
  * booth_front : glass, posts, door, header beam + ON AIR housing, side wall, roof
Pixi draws back -> (artist / staff) -> front so people can stand inside.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from math import radians  # noqa: E402

import bpy  # noqa: E402

from rst_iso import *  # noqa: E402,F401,F403

W, H = 240, 320
ANCHOR = (100, 235)
ORIGIN_G = (2.25, 1.0)
X0, X1, Y0, Y1 = 1.0, 3.5, 0.0, 1.0
ROOF_Z = 86 / 34.29
GLASS_Z = 74 / 34.29
BRASS = PAL["brass"]


def shift_all():
    ox, oy = ORIGIN_G
    for o in bpy.context.scene.objects:
        if o.type in {"MESH", "EMPTY"} and o.parent is None:
            o.location -= G(ox, oy, 0)
    bpy.context.view_layer.update()


def build_back():
    objs = []
    carpet = mat("carpet", 0x4A3A33, 0.95)
    foam_a, foam_b = mat("foamA", 0x6A574B, 0.95), mat("foamB", 0x3E332D, 0.95)
    objs.append(box_g("carpet", X0, X1, Y0, Y1, -0.03, 0.0, carpet, 0.0))
    # back wall: egg-crate foam pyramids on the y = 0 plane
    cols, rows = 10, 4
    cw, rh = (X1 - X0) / cols, (GLASS_Z - 0.25) / rows
    box_g("backplate", X0, X1, Y0 - 0.02, Y0, 0.0, ROOF_Z, foam_b, 0.0)
    for i in range(cols):
        for j in range(rows):
            cx, cz = X0 + cw * (i + 0.5), 0.12 + rh * (j + 0.5)
            m = foam_a if (i + j) % 2 else foam_b
            cyl(f"pyr{i}_{j}", G(cx, Y0 + 0.04, cz), cw * 0.62, 0.08, m, verts=4, axis="X", r2=0.0)
    # left wall inner face (x = X0): horizontal foam bands
    for j in range(6):
        z0 = 0.1 + (GLASS_Z - 0.1) * j / 6
        z1 = 0.1 + (GLASS_Z - 0.1) * (j + 1) / 6
        box_g(f"band{j}", X0 + 0.0, X0 + 0.05, Y0, Y1, z0, z1 - 0.02, foam_a if j % 2 else foam_b, 0.01)
    # warm ceiling strip so the interior reads through the glass
    box_g("ceiling_strip", 1.3, 3.2, 0.25, 0.38, ROOF_Z - 0.06, ROOF_Z - 0.03, mat("strip", 0xFFD9A0, 0.5, emit=4.0), 0.002)
    # mic stand: base disc, pole, boom arm, capsule, pop filter
    steel, dark = mat("steel", 0x9AA4BF, 0.35, metal=0.7), mat("dark", 0x1B1613, 0.6)
    bx, by = 2.25, 0.55
    cyl("mic_base", G(bx, by, 0.03), 0.15, 0.06, dark, 10)
    cyl("mic_pole", G(bx, by, 0.85), 0.022, 1.6, steel, 8)
    boom = box("mic_boom", G(bx + 0.14, by, 1.68), (0.03, 0.30, 0.03), steel, 0.004, rot=(0, 0, 0))
    boom.rotation_euler = (0, radians(-14), 0)
    cyl("mic_cap", G(bx + 0.3, by, 1.61), 0.065, 0.2, mat("capsule", BRASS, 0.3, metal=0.8), 10)
    cyl("mic_grille", G(bx + 0.3, by, 1.61), 0.07, 0.12, mat("grille", 0x2A2F3C, 0.5), 10)
    pop = cyl("pop", G(bx + 0.42, by, 1.6), 0.14, 0.012, mat("pop", 0x0E1117, 0.9), 14, axis="X")
    cyl("pop_arm", G(bx + 0.42, by, 1.6), 0.008, 0.02, steel, 6)
    # stool
    sx, sy = 1.75, 0.7
    seat = mat("seat", 0x6B3A2A, 0.8)
    cyl("stool_seat", G(sx, sy, 0.72), 0.2, 0.08, seat, 12, bevel=0.01)
    cyl("stool_post", G(sx, sy, 0.38), 0.02, 0.6, dark, 6)
    cyl("stool_ring", G(sx, sy, 0.22), 0.14, 0.014, steel, 12)
    for k in range(3):
        ang = radians(90 + k * 120)
        ex, ey = sx + 0.19 * __import__("math").cos(ang), sy + 0.19 * __import__("math").sin(ang)
        leg = box(f"stool_leg{k}", G((sx + ex) / 2, (sy + ey) / 2, 0.22), (0.022, 0.022, 0.46), dark, 0.004)
        leg.rotation_euler = (radians(14) * __import__("math").sin(ang), radians(14) * __import__("math").cos(ang), 0)
    # music stand
    mx, my = 2.85, 0.6
    cyl("ms_pole", G(mx, my, 0.55), 0.014, 1.1, dark, 6)
    box("ms_tray", G(mx, my - 0.02, 1.12), (0.04, 0.42, 0.26), mat("tray", 0x2F353C, 0.6), 0.008, rot=(radians(-12), 0, 0))
    box("ms_sheet", G(mx + 0.03, my - 0.02, 1.13), (0.012, 0.34, 0.20), mat("sheet", 0xF0E6CF, 0.9), 0.002, rot=(radians(-12), 0, 0))
    for k in range(3):
        ang = radians(90 + k * 120)
        box(f"ms_foot{k}", G(mx + 0.11 * __import__("math").cos(ang), my + 0.11 * __import__("math").sin(ang), 0.03),
            (0.22 if k == 0 else 0.2, 0.025, 0.025), dark, 0.004, rot=(0, 0, ang))
    # headphones on a hook (left wall)
    box("hook", G(X0 + 0.05, 0.4, 1.3), (0.05, 0.03, 0.03), steel, 0.004)
    box("hp_band", G(X0 + 0.11, 0.4, 1.2), (0.03, 0.26, 0.03), mat("hpband", 0x2A2F3C, 0.5), 0.006)
    for s in (-1, 1):
        cyl(f"hp_cup{s}", G(X0 + 0.12, 0.4 + s * 0.13, 1.06), 0.06, 0.05, mat("hpcup", 0xE6B866, 0.5), 8, axis="X")
    return objs


def build_front():
    frame = mat("frame", 0x2A2521, 0.6)
    brass = mat("brass", BRASS, 0.35, metal=0.6)
    wall = mat("wall", 0x3D302A, 0.8)
    roof = mat("roof", 0x4A3D34, 0.8)
    glass = mat("glass", PAL["glass"], 0.05, alpha=0.14)
    dark = mat("hdr", 0x231B16, 0.7)
    # glass pane (two panes split by the door posts), slightly behind the posts
    for a, b in ((X0, 1.9), (1.9, 2.75), (2.75, X1)):
        box_g(f"glass{a}", a, b, Y1 - 0.012, Y1 - 0.004, 0.02, GLASS_Z, glass, 0.0)
    # posts
    for px in (X0, 1.9, 2.75, X1):
        box_g(f"post{px}", px - 0.035, px + 0.035, Y1 - 0.03, Y1 + 0.03, 0, ROOF_Z, frame, 0.008)
        box_g(f"pcap{px}", px - 0.038, px + 0.038, Y1 - 0.033, Y1 + 0.033, GLASS_Z - 0.02, GLASS_Z, brass, 0.004)
    # door frame (between the last two posts) + handle
    for zz in (0.03, GLASS_Z - 0.03):
        box_g(f"dbar{zz}", 2.77, X1 - 0.035, Y1 - 0.02, Y1 + 0.02, zz - 0.015, zz + 0.015, mat("dfr", 0xCFE0E4, 0.3, metal=0.4), 0.004)
    box_g("handle", 2.86, 2.9, Y1 + 0.02, Y1 + 0.06, 0.85, 1.25, brass, 0.008)
    # header beam, brass rail, nameplate and ON AIR housing
    box_g("header", X0, X1, Y1 - 0.04, Y1 + 0.04, GLASS_Z, ROOF_Z, dark, 0.01)
    box_g("rail", X0, X1, Y1 - 0.045, Y1 + 0.045, GLASS_Z, GLASS_Z + 0.05, brass, 0.004)
    box_g("plate", 1.35, 1.95, Y1 + 0.04, Y1 + 0.055, 2.22, 2.42, mat("plate", 0x3A2C1F, 0.6), 0.004)
    box_g("plate_rim", 1.35, 1.95, Y1 + 0.052, Y1 + 0.058, 2.22, 2.24, brass, 0.002)
    box_g("lamp_house", 2.13, 2.37, Y1 + 0.04, Y1 + 0.09, 2.20, 2.40, mat("lampbox", 0x120D0A, 0.6), 0.01)
    cyl("lamp", G(2.25, Y1 + 0.095, 2.30), 0.045, 0.02, mat("lamp", 0x5A1A14, 0.4, emit=0.25), 10, axis="Y")
    # outer side wall facing the room + brass stripe
    box_g("side", X1, X1 + 0.05, Y0, Y1 + 0.03, 0, ROOF_Z, wall, 0.012)
    box_g("side_low", X1 + 0.045, X1 + 0.055, Y0, Y1 + 0.03, 0.05, 1.1, mat("wallLow", 0x2A201B, 0.85), 0.004)
    box_g("side_stripe", X1 + 0.05, X1 + 0.06, Y0, Y1 + 0.03, 1.1, 1.2, brass, 0.002)
    # roof
    box_g("roof", X0 - 0.02, X1 + 0.06, Y0, Y1 + 0.05, ROOF_Z, ROOF_Z + 0.07, roof, 0.015)
    box_g("roof_inset", X0 + 0.1, X1 - 0.1, Y0 + 0.1, Y1 - 0.05, ROOF_Z + 0.07, ROOF_Z + 0.085, mat("roof2", 0x54463C, 0.85), 0.006)


def render_layer(name, builder):
    reset()
    lights(strength=3.4, ambient=1.4)
    builder()
    shift_all()
    setup_render(W, H, ANCHOR, samples=24)
    render(out_path(f"{name}.png"))


def main():
    render_layer("booth_back", build_back)
    render_layer("booth_front", build_front)
    ox, oy = ORIGIN_G

    def px(gx, gy, z):
        p = project_px(G(gx - ox, gy - oy, z), W, H)
        return [round((p[0] - ANCHOR[0]) / SCALE, 1), round((p[1] - ANCHOR[1]) / SCALE, 1)]

    write_json(out_path("booth.json"), {
        "size": [W, H], "anchor": list(ANCHOR), "scale": 0.5, "originGame": list(ORIGIN_G),
        "onAirLamp": px(2.25, Y1 + 0.1, 2.30),
        "hotspot": [px(X0, Y1, 0), px(X1, Y1, 0), px(X1, Y1, ROOF_Z), px(X0, Y1, ROOF_Z)],
    })


main()
