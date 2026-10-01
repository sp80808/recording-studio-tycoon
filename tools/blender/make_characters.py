"""Render the modular low-poly staff/artist character as tintable sprite layers.

    Blender -b --python tools/blender/make_characters.py

Output: public/assets/studio/characters/<layer>_<dir>_<pose>.png + manifest.json

How the layers composite (bottom -> top, all drawn at the same origin):
    skin, face, shoes, bottom_*, top_*, hair_*, acc_*
Every layer above `skin` is rendered with the complete body as a *holdout*, so
anything that is behind the body (far arm, hair behind the head) is already
cut out. That lets the game mix any top / bottom / hair / accessory and tint
each layer with a flat colour (Pixi `sprite.tint`). Tintable layers are
rendered in neutral white so a tint multiply gives the right shaded colour.
Keep hair above the shoulders (z < 1.24) - it is not cut by the clothing.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from math import radians  # noqa: E402

import bpy  # noqa: E402

from rst_iso import *  # noqa: E402,F401,F403

W, H = 128, 160
ANCHOR = (64, 140)
DIRS = ["se", "ne", "nw", "sw"]  # character faces game +x, then rotates CCW seen from above
POSES = ["idle", "work"]

INK = 0x1B2130
BROW = 0x3A2A22
MOUTH = 0xB85C5C

parts = []  # (layer, obj)
_white = None


def tint_mat(name):
    return mat(name, 0xFFFFFF, rough=0.8, albedo_white=True)


def add(layer, obj):
    obj["layer"] = layer
    parts.append((layer, obj))
    return obj


def B(layer, name, c, d, m, bevel=0.012, rot=(0, 0, 0)):
    return add(layer, box(f"{layer}.{name}", c, d, m, bevel, rot))


def build(pose):
    """(Re)build every part for a pose. Local frame: +Y forward, +X right, +Z up."""
    global parts
    parts = []
    skin, white = tint_mat("skin"), tint_mat("tint")
    ink, brow, mouth = mat("ink", INK), mat("brow", BROW), mat("mouth", MOUTH)

    # --- body (skin) ---
    for s in (-1, 1):
        B("skin", f"leg{s}", (s * 0.105, 0, 0.41), (0.18, 0.18, 0.64), skin, 0.02)
    B("skin", "torso", (0, 0, 0.97), (0.46, 0.26, 0.52), skin, 0.04)
    add("skin", cyl("skin.neck", (0, 0.01, 1.29), 0.065, 0.14, skin, verts=8))
    B("skin", "head", (0, 0.01, 1.52), (0.38, 0.36, 0.38), skin, 0.085)
    if pose == "idle":
        for s in (-1, 1):
            B("skin", f"arm{s}", (s * 0.29, 0, 0.96), (0.10, 0.10, 0.52), skin, 0.02)
            B("skin", f"hand{s}", (s * 0.29, 0.015, 0.66), (0.10, 0.10, 0.10), skin, 0.025)
    else:
        for s in (-1, 1):
            B("skin", f"arm{s}", (s * 0.29, 0, 1.05), (0.10, 0.10, 0.30), skin, 0.02)
            B("skin", f"fore{s}", (s * 0.29, 0.11, 0.92), (0.10, 0.32, 0.10), skin, 0.02)
            B("skin", f"hand{s}", (s * 0.29, 0.30, 0.92), (0.10, 0.10, 0.10), skin, 0.025)

    # --- face details (fixed colours) ---
    for s in (-1, 1):
        B("face", f"eye{s}", (s * 0.085, 0.192, 1.54), (0.05, 0.02, 0.06), ink, 0.004)
        B("face", f"brow{s}", (s * 0.085, 0.192, 1.615), (0.085, 0.02, 0.022), brow, 0.004)
    B("face", "mouth", (0, 0.192, 1.42), (0.09, 0.02, 0.022), mouth, 0.004)

    # --- shoes ---
    for s in (-1, 1):
        B("shoes", f"shoe{s}", (s * 0.105, 0.05, 0.05), (0.195, 0.32, 0.10), white, 0.035)

    # --- bottoms ---
    for s in (-1, 1):
        B("bottom_jeans", f"leg{s}", (s * 0.105, 0, 0.405), (0.205, 0.205, 0.64), white, 0.02)
        B("bottom_shorts", f"leg{s}", (s * 0.105, 0, 0.58), (0.21, 0.21, 0.30), white, 0.02)
    for n in ("bottom_jeans", "bottom_shorts"):
        B(n, "hip", (0, 0, 0.76), (0.48, 0.28, 0.12), white, 0.03)
    add("bottom_skirt", cyl("bottom_skirt.cone", (0, 0, 0.6), 0.31, 0.3, white, verts=8, r2=0.23))
    B("bottom_skirt", "hip", (0, 0, 0.76), (0.48, 0.28, 0.12), white, 0.03)

    # --- tops ---
    def sleeve(layer, s, long_, thick):
        if pose == "idle":
            if long_:
                B(layer, f"sl{s}", (s * 0.30, 0, 0.94), (thick, thick, 0.56), white, 0.03)
            else:
                B(layer, f"sl{s}", (s * 0.30, 0, 1.10), (0.13, 0.13, 0.22), white, 0.03)
        else:
            B(layer, f"sl{s}", (s * 0.30, 0, 1.06), (thick if long_ else 0.13, thick if long_ else 0.13, 0.30), white, 0.03)
            if long_:
                B(layer, f"sf{s}", (s * 0.30, 0.115, 0.92), (thick, 0.33, thick), white, 0.03)

    B("top_tee", "body", (0, 0, 0.975), (0.49, 0.29, 0.54), white, 0.05)
    for s in (-1, 1):
        sleeve("top_tee", s, False, 0.13)
    B("top_hoodie", "body", (0, 0, 0.96), (0.52, 0.33, 0.58), white, 0.06)
    B("top_hoodie", "hood", (0, -0.15, 1.27), (0.36, 0.16, 0.20), white, 0.06)
    B("top_hoodie", "pocket", (0, 0.17, 0.85), (0.32, 0.04, 0.13), white, 0.015)
    for s in (-1, 1):
        sleeve("top_hoodie", s, True, 0.135)
    B("top_jacket", "body", (0, 0, 0.94), (0.50, 0.31, 0.64), white, 0.04)
    for s in (-1, 1):
        B("top_jacket", f"lapel{s}", (s * 0.095, 0.158, 1.06), (0.10, 0.02, 0.34), white, 0.008, rot=(0, 0, radians(s * 18)))
        sleeve("top_jacket", s, True, 0.12)

    # --- hair (kept above the shoulders) ---
    hair = tint_mat("hair")

    def hair_base(layer):
        B(layer, "top", (0, -0.005, 1.685), (0.42, 0.40, 0.15), hair, 0.05)
        B(layer, "back", (0, -0.17, 1.56), (0.42, 0.10, 0.27), hair, 0.04)
        for s in (-1, 1):
            B(layer, f"burn{s}", (s * 0.205, 0.0, 1.50), (0.035, 0.12, 0.16), hair, 0.01)

    hair_base("hair_short")
    hair_base("hair_quiff")
    B("hair_quiff", "quiff", (0, 0.17, 1.78), (0.30, 0.20, 0.13), hair, 0.05, rot=(radians(-18), 0, 0))
    hair_base("hair_long")
    B("hair_long", "curtain", (0, -0.18, 1.45), (0.44, 0.12, 0.40), hair, 0.04)
    for s in (-1, 1):
        B("hair_long", f"lock{s}", (s * 0.225, -0.04, 1.47), (0.06, 0.16, 0.30), hair, 0.02)
    hair_base("hair_bun")
    add("hair_bun", sphere("hair_bun.bun", (0, -0.14, 1.82), 0.115, hair, 8, 6))
    add("hair_puffy", sphere("hair_puffy.puff", (0, -0.01, 1.66), 0.27, hair, 10, 7, scale=(1.05, 1.0, 0.92)))

    # --- accessories ---
    band = mat("band", 0x2A2F3C)
    B("acc_headphones", "band", (0, 0, 1.735), (0.44, 0.05, 0.04), band, 0.012)
    for s in (-1, 1):
        B("acc_headphones", f"arm{s}", (s * 0.225, 0, 1.66), (0.04, 0.05, 0.16), band, 0.01)
        add("acc_headphones", cyl(f"acc_headphones.cup{s}", (s * 0.235, 0, 1.52), 0.095, 0.075, white, verts=10, axis="X"))
    glass = mat("frame", 0x11151F)
    for s in (-1, 1):
        B("acc_glasses", f"lens{s}", (s * 0.088, 0.198, 1.54), (0.135, 0.025, 0.09), glass, 0.008)
        B("acc_glasses", f"temple{s}", (s * 0.192, 0.04, 1.545), (0.02, 0.33, 0.02), glass, 0.004)
    B("acc_glasses", "bridge", (0, 0.198, 1.555), (0.05, 0.022, 0.02), glass, 0.004)
    add("acc_cap", sphere("acc_cap.dome", (0, 0.0, 1.66), 0.225, white, 10, 6, scale=(0.98, 0.95, 0.68)))
    B("acc_cap", "brim", (0, 0.245, 1.655), (0.30, 0.17, 0.03), white, 0.012)
    add("acc_beanie", sphere("acc_beanie.dome", (0, 0, 1.66), 0.23, white, 10, 6, scale=(0.98, 0.95, 0.78)))
    B("acc_beanie", "cuff", (0, 0, 1.60), (0.42, 0.40, 0.06), white, 0.02)
    add("acc_beanie", sphere("acc_beanie.pom", (0, -0.02, 1.88), 0.055, white, 6, 4))

    root = bpy.data.objects.new("char", None)
    bpy.context.scene.collection.objects.link(root)
    for _, o in parts:
        o.parent = root
    return root


def layers():
    seen = []
    for l, _ in parts:
        if l not in seen:
            seen.append(l)
    return seen


def render_pose(pose, only=None):
    root = build(pose)
    body = [o for l, o in parts if l == "skin"]
    hold = holdout_mat()
    original = {o.name: o.data.materials[0] for _, o in parts}
    for d_i, d in enumerate(DIRS):
        root.rotation_euler = (0, 0, radians(90 * d_i))
        bpy.context.view_layer.update()
        for layer in layers():
            if only and layer not in only:
                continue
            for l, o in parts:
                vis = l == layer or (l == "skin" and layer != "skin")
                o.hide_render = not vis
                o.data.materials[0] = hold if (l == "skin" and layer != "skin") else original[o.name]
            render(out_path("characters", f"{layer}_{d}_{pose}.png"))
    return root


def main():
    reset()
    lights(strength=2.6, ambient=0.85)
    setup_render(W, H, ANCHOR, samples=24)
    only = set(sys.argv[sys.argv.index("--") + 1:]) if "--" in sys.argv else None
    pose_layers = {}
    for pose in POSES:
        root = render_pose(pose, only)
        pose_layers = layers()
        for _, o in parts:
            bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.objects.remove(root, do_unlink=True)
    order = ["skin", "face", "shoes", "bottom_jeans", "bottom_shorts", "bottom_skirt", "top_tee",
             "top_hoodie", "top_jacket", "hair_short", "hair_quiff", "hair_long", "hair_bun", "hair_puffy",
             "acc_headphones", "acc_glasses", "acc_cap", "acc_beanie"]
    write_json(out_path("characters", "manifest.json"), {
        "size": [W, H], "anchor": list(ANCHOR), "scale": 0.5, "dirs": DIRS, "poses": POSES, "layers": order,
        "note": "Layers composite bottom->top at the same origin; tintable layers are white.",
    })


main()
