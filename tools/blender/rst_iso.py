"""Shared helpers for rendering Recording Studio Tycoon isometric sprites.

Run scripts in this folder headless, e.g.
    /Applications/Blender.app/Contents/MacOS/Blender -b --python tools/blender/make_clock.py

Conventions (keep these so sprites line up with the Pixi scene):
  * Author in GAME tile coordinates with the `G()` / `box_g()` helpers.
    One game tile = 1 Blender unit, z is up. Game +x runs down-right on
    screen, game +y runs down-left (see src/components/studio/isoMath.ts).
  * Camera is orthographic at the game's 2:1 projection (azimuth 45 deg,
    elevation 30 deg). 1 unit of floor = 56px wide diamond at 1x; we render
    at 2x (SCALE) and the game draws the sprite at scale 0.5.
  * The world origin lands on a chosen pixel of the image (the sprite's
    anchor), so Pixi can place a sprite at iso(gx, gy) without fiddling.
  * Flat, low-poly look: no textures, few vertices, small bevels only.
"""
import json
import math
import os

import bpy
import bmesh
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

SCALE = 2  # render at 2x, draw at 0.5x
TILE_W = 56
PPU = TILE_W * SCALE / math.sqrt(2)  # pixels per Blender unit along a floor axis

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_ROOT = os.path.join(REPO, "public", "assets", "studio")

# Game palette (matches COLORS / ERA_GRADES in WebGLCanvas.tsx).
PAL = {
    "trim": 0x2A1F18,
    "wall": 0x2B3B36,
    "wood": 0x7A5A43,
    "wood_dark": 0x4A3A2C,
    "steel": 0x9AA4BF,
    "steel_dark": 0x3D4459,
    "ink": 0x1B2130,
    "brass": 0xE6B866,
    "glass": 0xA6D8E6,
    "foam": 0x39455E,
    "white": 0xF2F2F2,
    "red": 0xE05C5C,
    "green": 0x7BD389,
    "blue": 0x5AA9E6,
    "amber": 0xD9A441,
    "purple": 0xC77DFF,
}


def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(h, a=1.0):
    r, g, b = ((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255
    return (srgb_to_lin(r), srgb_to_lin(g), srgb_to_lin(b), a)


# --------------------------------------------------------------------- scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def G(x, y, z=0.0):
    """Game tile coords (x, y, height) -> Blender world vector.

    Blender X = game y, Blender Y = game x (see module docstring)."""
    return Vector((y, x, z))


_mats = {}


def mat(name, color, rough=0.75, metal=0.0, emit=0.0, alpha=1.0, albedo_white=False):
    """Flat colored material. `albedo_white` renders the part neutral so the
    game can tint it at runtime (used by the character layers)."""
    key = (name, color, rough, metal, emit, alpha, albedo_white)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    base = hex_rgba(0xFFFFFF if albedo_white else color)
    bsdf.inputs["Base Color"].default_value = base
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.25
    if emit > 0:
        bsdf.inputs["Emission Color"].default_value = hex_rgba(color)
        bsdf.inputs["Emission Strength"].default_value = emit
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            pass
    _mats[key] = m
    return m


def holdout_mat():
    if "holdout" in _mats:
        return _mats["holdout"]
    m = bpy.data.materials.new("holdout")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    h = nt.nodes.new("ShaderNodeHoldout")
    nt.links.new(h.outputs[0], out.inputs["Surface"])
    _mats["holdout"] = m
    return m


def _finish(obj, material, bevel=0.0, smooth=False):
    if material is not None:
        obj.data.materials.clear()
        obj.data.materials.append(material)
    if bevel > 0:
        mod = obj.modifiers.new("bev", "BEVEL")
        mod.width = bevel
        mod.segments = 1
        mod.limit_method = "ANGLE"
    if smooth:
        bpy.ops.object.shade_smooth()
    return obj


def box(name, center, dim, material, bevel=0.012, rot=(0, 0, 0)):
    """Box centred at Blender-space `center` with size `dim` = (dx, dy, dz)."""
    bpy.ops.mesh.primitive_cube_add(location=center, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = (dim[0] / 2, dim[1] / 2, dim[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, material, bevel)


def box_g(name, x0, x1, y0, y1, z0, z1, material, bevel=0.012):
    """Axis-aligned box from GAME coords: x0..x1 (down-right), y0..y1 (down-left), z0..z1 (up)."""
    c = G((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    return box(name, c, (abs(y1 - y0), abs(x1 - x0), abs(z1 - z0)), material, bevel)


def cyl(name, center, radius, depth, material, verts=10, axis="Z", bevel=0.0, r2=None):
    rot = {"Z": (0, 0, 0), "X": (0, math.radians(90), 0), "Y": (math.radians(90), 0, 0)}[axis]
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=center, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=radius, radius2=r2, depth=depth, location=center, rotation=rot)
    o = bpy.context.object
    o.name = name
    return _finish(o, material, bevel)


def sphere(name, center, radius, material, seg=8, rings=6, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=radius, location=center)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, material)


def parent_to(children, name, origin=(0, 0, 0)):
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    root.location = origin
    for c in children:
        c.parent = root
    return root


def lights(strength=3.2, ambient=0.55, sun_tint=(1.0, 0.96, 0.9)):
    w = bpy.context.scene.world or bpy.data.worlds.new("w")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.55, 0.6, 0.72, 1)
    bg.inputs[1].default_value = ambient
    # Key from the screen's upper-left (window side), soft fill is the world.
    bpy.ops.object.light_add(type="SUN", location=(4, -3, 8))
    sun = bpy.context.object
    sun.data.energy = strength
    sun.data.color = sun_tint
    sun.data.angle = math.radians(18)
    sun.rotation_euler = (math.radians(48), math.radians(14), math.radians(150))
    return sun


def setup_render(w_px, h_px, anchor_px, samples=16, transparent=True):
    """Orthographic 2:1 camera. `anchor_px` = (x, y) pixel where world origin lands."""
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    try:
        sc.eevee.taa_render_samples = samples
        sc.eevee.use_shadows = True
    except Exception:
        pass
    sc.render.resolution_x, sc.render.resolution_y = int(w_px), int(h_px)
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = transparent
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"

    cd = bpy.data.cameras.new("cam")
    cd.type = "ORTHO"
    cd.ortho_scale = max(w_px, h_px) / PPU
    cam = bpy.data.objects.new("cam", cd)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.rotation_euler = (math.radians(60), 0, math.radians(135))
    # Camera sits on its own +Z axis, far away, looking at the origin.
    cam.location = Vector((0.612, 0.612, 0.5)) * 40
    bpy.context.view_layer.update()
    for _ in range(2):
        co = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
        dx, dy = anchor_px[0] / w_px, 1 - anchor_px[1] / h_px
        m = max(w_px, h_px)
        cd.shift_x += (co.x - dx) * w_px / m
        cd.shift_y += (co.y - dy) * h_px / m
        bpy.context.view_layer.update()
    return cam


def project_px(point, w_px, h_px):
    """World-space point -> (x, y) image pixels (top-left origin) for the active camera."""
    sc = bpy.context.scene
    co = world_to_camera_view(sc, sc.camera, Vector(point))
    return [round(co.x * w_px, 1), round((1 - co.y) * h_px, 1)]


def out_path(*parts):
    p = os.path.join(OUT_ROOT, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


def render(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("RENDERED", path)


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=1)


def set_visible(objs, visible):
    for o in objs:
        o.hide_render = not visible
        o.hide_viewport = not visible


def all_mesh_objects():
    return [o for o in bpy.context.scene.objects if o.type == "MESH"]
