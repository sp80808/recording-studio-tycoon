"""Blender-only stage: fixed 2:1 camera, shared materials/light, transparent renders.

Run via build-studio-kit.py; never execute in a user's open Blender scene.
"""
import json
import math
from pathlib import Path
import sys
import bpy
from mathutils import Vector

root, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
kit = json.loads((root / 'art-source/studio-kit/kit.json').read_text())
scene = bpy.context.scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.seed = 7
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 256
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.65, 0.72, 0.85, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35

camera = bpy.data.objects.new('RST 2:1 orthographic', bpy.data.cameras.new('RST camera'))
scene.collection.objects.link(camera)
camera.location = (-7, -7, math.sqrt(98) * math.tan(math.radians(30)))
camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 6.4  # 40 image pixels/unit: floor axes project to 28x14, matching RST.
scene.camera = camera

for name, position, energy, size, color in [
    ('Warm key', (-3, -4, 7), 600, 4, (1, 0.9, 0.78)),
    ('Cool fill', (4, 1, 5), 350, 5, (0.78, 0.85, 1)),
]:
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, 'AREA'))
    scene.collection.objects.link(light)
    light.location = position
    light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
    light.data.energy, light.data.size, light.data.color = energy, size, color

bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object
floor.name = 'Transparent contact shadows'
floor.is_shadow_catcher = True
floor.location.z = -0.005

def linear(value):
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4

output.mkdir(parents=True, exist_ok=True)
for name in kit['models']:
    before = set(bpy.data.objects)
    bpy.ops.wm.obj_import(filepath=str(root / f'art-source/studio-kit/models/{name}.obj'), forward_axis='NEGATIVE_Z', up_axis='Y')
    objects = list(set(bpy.data.objects) - before)
    bounds = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    center = Vector(((min(v.x for v in bounds) + max(v.x for v in bounds)) / 2,
                     (min(v.y for v in bounds) + max(v.y for v in bounds)) / 2, min(v.z for v in bounds)))
    for obj in objects:
        obj.location -= center
        for material in obj.data.materials:
            color = kit['palette'].get(material.name.split('.')[0], '546071')
            rgb = tuple(linear(int(color[i:i+2], 16) / 255) for i in (0, 2, 4))
            material.use_nodes = True
            shader = material.node_tree.nodes.get('Principled BSDF')
            shader.inputs['Base Color'].default_value = (*rgb, 1)
            shader.inputs['Roughness'].default_value = 0.8
    scene.render.filepath = str(output / f'{name}.png')
    bpy.ops.render.render(write_still=True)
    print(f'BAKED {name}', flush=True)
    for obj in objects:
        bpy.data.objects.remove(obj, do_unlink=True)

(output / 'blender-version.txt').write_text(bpy.app.version_string)
