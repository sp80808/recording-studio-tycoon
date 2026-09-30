"""Render the five mixing-console tiers (home desk -> flagship console).

    Blender -b --python tools/blender/make_console.py [-- 1 2 3]

Output: public/assets/studio/console_t<1..5>.png and console.json.
Static body, knobs, speakers, displays and rack are baked. Fader caps and VU
ladders are drawn by Pixi on top so they can animate; console.json gives their
positions in 1x pixels relative to the sprite origin, which is the desk centre
on the floor, game tile (4.5, 4.25).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from math import radians  # noqa: E402

import bpy  # noqa: E402
import bmesh  # noqa: E402

from rst_iso import *  # noqa: E402,F401,F403

W, H = 360, 420
ORIGIN_G = (4.5, 4.25)
DESK_Z = 40 / 34.29  # matches deskH = 40px used by the props sitting on the desk
BRIDGE_H = 14 / 34.29
SLOPE_BACK = 0.10

# Mirrors getConsoleProfile() in src/components/WebGLCanvas.tsx.
TIERS = {
    1: dict(channels=4, displays=0, racks=1, finish=0x4A3627, trim=0x735138, leather=0x2E1F16, cheek=0x5C3D28, meter=0xFFEAA7),
    2: dict(channels=8, displays=1, racks=2, finish=0x3D4554, trim=0x576378, leather=0x1F232B, cheek=0x453123, meter=0x0C0F14),
    3: dict(channels=12, displays=1, racks=3, finish=0x2C3B4D, trim=0x4D6482, leather=0x18202B, cheek=0x3B2A1E, meter=0x0C0F14),
    4: dict(channels=16, displays=2, racks=4, finish=0x222730, trim=0x464E5E, leather=0x14171D, cheek=0x2E231B, meter=0x0C0F14),
    5: dict(channels=20, displays=2, racks=5, finish=0x1A1E26, trim=0xD4A553, leather=0x101318, cheek=0x421D12, meter=0x0C0F14),
}
KNOB_COLORS = [0x3B82F6, 0xD93838, 0x2DD4BF, 0xF59E0B, 0xA855F7]
GEAR = [0xD9A441, 0x5AA9E6, 0xE05C5C, 0x7BD389, 0xC77DFF, 0xF2F2F2]


def surf_z(y):
    """Height of the sloped control surface at game y (back y=3.68 high -> front y=4.85 at desk height)."""
    t = min(1.0, max(0.0, (y - 3.68) / (4.85 - 3.68)))
    return DESK_Z + SLOPE_BACK * (1 - t)


def wedge(name, x0, x1, y0, y1, z_base, m):
    """Control surface: flat sides, top slopes from back (y0) down to front (y1)."""
    zb, zf = surf_z(y0), surf_z(y1)
    verts = [G(x0, y0, z_base), G(x1, y0, z_base), G(x1, y1, z_base), G(x0, y1, z_base),
             G(x0, y0, zb), G(x1, y0, zb), G(x1, y1, zf), G(x0, y1, zf)]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    return o


def slab(name, gx0, gx1, gy0, gy1, thick, m, bevel=0.008):
    """Thin plate lying on the sloped surface (follows the local height at its centre)."""
    cy = (gy0 + gy1) / 2
    z0 = surf_z(cy)
    return box_g(name, gx0, gx1, gy0, gy1, z0 - 0.002, z0 + thick, m, bevel)


def build(tier):
    cfg = TIERS[tier]
    n = cfg["channels"]
    finish, trim = mat("finish", cfg["finish"], 0.55), mat("trim", cfg["trim"], 0.4, metal=0.5 if tier == 5 else 0.2)
    leather, cheek = mat("leather", cfg["leather"], 0.9), mat("cheek", cfg["cheek"], 0.7)
    side = mat("side", 0x2B3142, 0.8)
    plate = mat("plate", 0x232936, 0.6)
    dark = mat("dark", 0x10141A, 0.5)
    anchors = {"faders": [], "meters": []}

    # cabinet + cheeks + plinth
    box_g("plinth", 3.06, 5.94, 3.56, 4.96, 0, 0.07, dark, 0.004)
    box_g("body", 3.12, 5.88, 3.52, 4.98, 0.07, DESK_Z - 0.04, side, 0.01)
    for x0, x1 in ((3.0, 3.15), (5.85, 6.0)):
        box_g(f"cheek{x0}", x0, x1, 3.5, 5.0, 0, DESK_Z + 0.06, cheek, 0.02)
    # sloped control surface
    wedge("surface", 3.15, 5.85, 3.68, 4.85, DESK_Z - 0.06, finish)
    # flat rear deck (under the bridge) and leather armrest
    box_g("deck", 3.15, 5.85, 3.42, 3.70, DESK_Z - 0.06, DESK_Z + SLOPE_BACK, finish, 0.008)
    box_g("arm", 3.15, 5.85, 4.85, 5.0, DESK_Z - 0.07, DESK_Z + 0.05, leather, 0.04)
    if tier >= 3:
        box_g("trimline", 3.17, 5.83, 4.83, 4.85, DESK_Z - 0.03, DESK_Z + 0.03, trim, 0.004)
    if tier >= 5:
        box_g("gold", 3.18, 5.82, 4.67, 4.695, DESK_Z - 0.0, DESK_Z + 0.02, trim, 0.004)

    # meter bridge
    box_g("bridge", 3.22, 5.42, 3.42, 3.70, DESK_Z, DESK_Z + BRIDGE_H, mat("bridge", 0x222834, 0.5), 0.02)
    box_g("bridge_trim", 3.22, 5.42, 3.42, 3.70, DESK_Z + BRIDGE_H - 0.02, DESK_Z + BRIDGE_H, trim, 0.004)
    nm = min(n, 12)
    slot_w = 3.5
    for i in range(nm):
        mx = 3.30 + (i + 0.5) / nm * (5.34 - 3.30)
        if tier == 1:
            d = cyl(f"dial{i}", G(mx, 3.705, DESK_Z + BRIDGE_H * 0.5), 0.085, 0.03, mat("dial", cfg["meter"], 0.4, emit=0.25), 12, axis="Y")
            cyl(f"needle{i}", G(mx, 3.72, DESK_Z + BRIDGE_H * 0.5), 0.012, 0.01, mat("red", 0xCC3333), 6, axis="Y")
        else:
            box_g(f"slot{i}", mx - 0.055, mx + 0.055, 3.695, 3.715, DESK_Z + 0.03, DESK_Z + BRIDGE_H - 0.04, mat("slot", cfg["meter"], 0.4), 0.004)
        anchors["meters"].append({"gx": mx, "gy": 3.72, "z0": DESK_Z + 0.03, "z1": DESK_Z + BRIDGE_H - 0.04,
                                  "w": slot_w})

    # displays on top of the bridge
    screen = mat("screen", 0x091B29, 0.3, emit=0.6)
    bezel = mat("bezel", 0x0F141D, 0.4)
    if cfg["displays"]:
        spans = [(4.02, 4.62)] if cfg["displays"] == 1 else [(3.65, 4.25), (4.40, 5.00)]
        for k, (a, b) in enumerate(spans):
            z0 = DESK_Z + BRIDGE_H
            box_g(f"disp{k}", a, b, 3.44, 3.50, z0, z0 + 0.72, bezel, 0.012)
            box_g(f"scr{k}", a + 0.03, b - 0.03, 3.502, 3.51, z0 + 0.04, z0 + 0.68, screen, 0.002)
            for tr in range(3):
                col = ([0x38BDF8, 0x4ADE80, 0xFBBF24] if k == 0 else [0xA855F7, 0xEC4899, 0x06B6D4])[tr]
                box_g(f"trk{k}{tr}", a + 0.06, b - 0.06 - tr * 0.05, 3.51, 3.516, z0 + 0.12 + tr * 0.18, z0 + 0.22 + tr * 0.18,
                      mat(f"trk{col}", col, 0.3, emit=1.4), 0.001)
            box_g(f"stand{k}", (a + b) / 2 - 0.05, (a + b) / 2 + 0.05, 3.45, 3.49, z0, z0 + 0.06, dark, 0.004)

    # monitors
    cone = mat("cone", 0xEEEAE1, 0.6)
    spk = mat("spk", 0x181C24 if tier > 1 else 0x3E2C1E, 0.6)
    for sx in ([3.22] if tier == 1 else [3.20, 5.34]):
        z0 = DESK_Z + BRIDGE_H
        w = 0.22 if tier == 1 else 0.25
        h = 0.40 if tier == 1 else 0.58
        box_g(f"spk{sx}", sx - w / 2, sx + w / 2, 3.40, 3.62, z0, z0 + h, spk, 0.02)
        cyl(f"woof{sx}", G(sx, 3.635, z0 + h * 0.36), w * 0.32, 0.02, cone if tier > 1 else mat("cone1", 0x6E5238), 10, axis="Y")
        cyl(f"tw{sx}", G(sx, 3.63, z0 + h * 0.78), w * 0.1, 0.02, mat("tw", 0x475569), 8, axis="Y")

    # channel strips: plates, knobs, buttons, fader grooves
    pitch = (5.22 - 3.30) / n
    kr = min(0.045, pitch * 0.2)
    for i in range(n):
        cx = 3.30 + (i + 0.5) * pitch
        slab(f"strip{i}", cx - pitch * 0.46, cx + pitch * 0.46, 3.74, 4.72, 0.012, plate if i % 2 else mat("plate2", 0x2A3140, 0.6))
        for k, yk in enumerate([3.80, 3.90, 4.00, 4.10, 4.19]):
            col = (0xD93838 if i % 2 else 0x3B82F6) if k == 0 else [0x2DD4BF, 0xF59E0B, 0xA855F7, 0xD1D5DB][k - 1]
            z = surf_z(yk) + 0.012
            cyl(f"kn{i}_{k}", G(cx, yk, z + 0.02), kr * (1.0 if k == 0 else 0.85), 0.04, mat(f"kn{col}", col, 0.5), 8)
        z = surf_z(4.26) + 0.014
        box_g(f"solo{i}", cx - pitch * 0.3, cx - pitch * 0.08, 4.245, 4.275, z, z + 0.014, mat("solo", 0x22C55E, 0.4, emit=0.6), 0.002)
        box_g(f"mute{i}", cx + pitch * 0.08, cx + pitch * 0.3, 4.245, 4.275, z, z + 0.014, mat("mute", 0xEF4444, 0.4, emit=0.5), 0.002)
        zg = surf_z(4.53) + 0.013
        box_g(f"groove{i}", cx - 0.008, cx + 0.008, 4.31, 4.75, zg, zg + 0.004, dark, 0.0)
        anchors["faders"].append({"gx": cx, "gy0": 4.34, "gy1": 4.72, "z0": surf_z(4.34) + 0.02, "z1": surf_z(4.72) + 0.02})
    # master section
    zv = surf_z(4.05) + 0.014
    cyl("master_vol", G(5.36, 4.05, zv + 0.025), 0.065, 0.05, mat("mv", 0xD4D8E2, 0.35, metal=0.6), 12)
    for mx in (5.32, 5.40):
        box_g(f"mf{mx}", mx - 0.03, mx + 0.03, 4.55, 4.59, surf_z(4.57) + 0.012, surf_z(4.57) + 0.05, mat("mf", 0xEF4444, 0.4), 0.004)

    # outboard column / tape machine
    if tier == 1:
        box_g("tape", 5.54, 5.80, 4.05, 4.58, DESK_Z, DESK_Z + 0.09, mat("tape", 0x242D3D, 0.5), 0.02)
        for yy in (4.20, 4.42):
            cyl(f"reel{yy}", G(5.67, yy, DESK_Z + 0.12), 0.09, 0.04, mat("reel", 0x718096, 0.4, metal=0.5), 12)
            cyl(f"hub{yy}", G(5.67, yy, DESK_Z + 0.15), 0.035, 0.03, dark, 8)
    else:
        units = cfg["racks"]
        h = 0.62 / units
        for u in range(units):
            y1 = 4.02 + u * h
            box_g(f"rack{u}", 5.54, 5.80, y1, y1 + h * 0.85, DESK_Z, DESK_Z + 0.14, mat("rk", 0x1E2430, 0.5), 0.012)
            box_g(f"rtrim{u}", 5.54, 5.80, y1, y1 + h * 0.85, DESK_Z + 0.13, DESK_Z + 0.142, trim, 0.002)
            box_g(f"led{u}", 5.575, 5.605, y1 + h * 0.3, y1 + h * 0.55, DESK_Z + 0.142, DESK_Z + 0.156,
                  mat("ledg", 0x22C55E if u % 2 == 0 else 0xF59E0B, 0.4, emit=1.6), 0.002)
            box_g(f"rm{u}", 5.65, 5.74, y1 + h * 0.35, y1 + h * 0.5, DESK_Z + 0.142, DESK_Z + 0.152, mat("rmeter", 0x38BDF8, 0.4, emit=1.2), 0.002)
    return anchors


def main():
    tiers = [int(a) for a in sys.argv[sys.argv.index("--") + 1:]] if "--" in sys.argv else [1, 2, 3, 4, 5]
    allp = {}
    for t in tiers:
        reset()
        lights(strength=3.0, ambient=0.7)
        anchors = build(t)
        ox, oy = ORIGIN_G
        # Camera origin is the game-space sprite origin on the floor; shift the scene instead.
        for o in list(bpy.context.scene.objects):
            if o.type == "MESH":
                o.location -= G(ox, oy, 0)
        bpy.context.view_layer.update()
        # meshes made with from_pydata carry absolute vertices; shift them too
        for o in bpy.context.scene.objects:
            if o.type == "MESH" and o.name.startswith("surface"):
                o.location = -G(ox, oy, 0)
        setup_render(W, H, (W // 2, 330), samples=24)
        out = []
        for key, lst in anchors.items():
            pass
        def px(gx, gy, z):
            p = project_px(G(gx - ox, gy - oy, z), W, H)
            return [round((p[0] - W // 2) / SCALE, 1), round((p[1] - 330) / SCALE, 1)]
        data = {
            "faders": [{"x": px(f["gx"], f["gy0"], f["z0"])[0], "y0": px(f["gx"], f["gy0"], f["z0"])[1],
                        "y1": px(f["gx"], f["gy1"], f["z1"])[1]} for f in anchors["faders"]],
            "meters": [{"x": px(m["gx"], m["gy"], m["z0"])[0], "yBottom": px(m["gx"], m["gy"], m["z0"])[1],
                        "yTop": px(m["gx"], m["gy"], m["z1"])[1], "w": m["w"]} for m in anchors["meters"]],
        }
        allp[str(t)] = data
        render(out_path(f"console_t{t}.png"))
    path = out_path("console.json")
    prev = {}
    if os.path.exists(path):
        import json
        prev = json.load(open(path)).get("tiers", {})
    prev.update(allp)
    write_json(path, {"size": [W, H], "anchor": [W // 2, 330], "scale": 0.5, "originGame": list(ORIGIN_G),
                      "deskZPx": 40, "tiers": prev})


main()
