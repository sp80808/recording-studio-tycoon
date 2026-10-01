"""Fetch pinned CC0 models, render through Blender, trim/pack a Pixi atlas.

Requires Blender and Pillow. Source meshes stay outside public/; only the atlas ships.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[2]
kit_dir = root / 'art-source/studio-kit'
kit = json.loads((kit_dir / 'kit.json').read_text())
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--blender', default=shutil.which('blender') or '/Applications/Blender.app/Contents/MacOS/Blender')
parser.add_argument('--renders', type=Path, help='Reuse existing PNG bakes; skips Blender.')
args = parser.parse_args()
destination = root / 'public/assets/studio-kit'
destination.mkdir(parents=True, exist_ok=True)

with tempfile.TemporaryDirectory(prefix='rst-studio-kit-') as temp:
    temp = Path(temp)
    models = kit_dir / 'models'
    if not all((models / f'{name}.{ext}').exists() for name in kit['models'] for ext in ('obj', 'mtl')):
        archive = temp / 'furniture.zip'
        urllib.request.urlretrieve(kit['source']['downloadUrl'], archive)
        assert hashlib.sha256(archive.read_bytes()).hexdigest() == kit['source']['archiveSha256'], 'Source archive changed; review publisher/license before updating hash.'
        models.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive) as pack:
            for name in kit['models']:
                for ext in ('obj', 'mtl'):
                    (models / f'{name}.{ext}').write_bytes(pack.read(f'Models/OBJ format/{name}.{ext}'))
            (kit_dir / 'License.txt').write_bytes(pack.read('License.txt'))
    renders = args.renders or temp / 'renders'
    if not args.renders:
        subprocess.run([args.blender, '--background', '--factory-startup', '--python', str(root / 'scripts/assets/render-studio-kit.py'), '--', str(root), str(renders)], check=True)

    frames = {}
    cropped = []
    for name in kit['models']:
        image = Image.open(renders / f'{name}.png').convert('RGBA')
        assert image.size == (256, 256), f'Unexpected canvas for {name}'
        # Cycles shadow-catcher noise below 5% alpha can span the entire canvas.
        alpha = image.getchannel('A').point(lambda a: 0 if a < 12 else a)
        image.putalpha(alpha)
        bounds = alpha.getbbox()
        assert bounds, f'Empty sprite {name}'
        left, top, right, bottom = bounds
        assert left > 0 and top > 0 and right < 256 and bottom < 256, f'Clipped sprite or unbounded shadow for {name}'
        cropped.append((name, image.crop(bounds), left, top))
    atlas = Image.new('RGBA', (1024, 512))
    x = y = row_height = 2
    for name, image, left, top in cropped:
        if x + image.width + 2 > atlas.width:
            x, y, row_height = 2, y + row_height + 4, 0
        assert y + image.height + 2 <= atlas.height, 'Atlas budget exceeded'
        atlas.alpha_composite(image, (x, y))
        frames[name] = {'frame': {'x': x, 'y': y, 'w': image.width, 'h': image.height}, 'rotated': False, 'trimmed': True,
                        'spriteSourceSize': {'x': left, 'y': top, 'w': image.width, 'h': image.height},
                        'sourceSize': {'w': 256, 'h': 256}, 'pivot': {'x': 0.5, 'y': 0.5}}
        x += image.width + 4
        row_height = max(row_height, image.height)
    atlas.save(destination / 'studio-kit.webp', lossless=True, method=6)
    atlas_json = {'frames': frames, 'meta': {'app': 'RST Blender bake', 'version': '1', 'image': 'studio-kit.webp',
                                          'format': 'RGBA8888', 'size': {'w': 1024, 'h': 512}, 'scale': '1'}}
    (destination / 'studio-kit.json').write_text(json.dumps(atlas_json, indent=2) + '\n')
    manifest = {'assetId': 'rst-studio-kit-v1', 'sourceType': 'blender', 'author': 'Kenney; RST material/camera adaptation',
                'creationTimestamp': datetime.now(timezone.utc).isoformat(), 'toolVersion': (renders / 'blender-version.txt').read_text().strip(),
                'pipelineSteps': ['Pinned CC0 OBJ/MTL extraction', 'RST palette remap and front-facing rotation', '30 degree elevation, 45 degree azimuth orthographic bake', 'Shared soft lighting and transparent contact shadows', 'Alpha trimming, 2px gutters, lossless WebP atlas'],
                'dimensions': {'width': 1024, 'height': 512}, 'paletteId': 'rst-studio-slate-oak', 'frameTags': kit['models'],
                'checksum': hashlib.sha256((destination / 'studio-kit.webp').read_bytes()).hexdigest(),
                'source': {**kit['source'], 'models': kit['models']}}
    (destination / 'provenance.json').write_text(json.dumps(manifest, indent=2) + '\n')
    shutil.copyfile(kit_dir / 'License.txt', destination / 'License.txt')
    preview = Image.new('RGBA', (1000, 800), '#202939')
    draw = ImageDraw.Draw(preview)
    for index, (name, image, _, _) in enumerate(cropped):
        px, py = (index % 5) * 200, (index // 5) * 200
        image = image.resize((image.width * 3, image.height * 3), Image.Resampling.LANCZOS)
        image.thumbnail((180, 145), Image.Resampling.LANCZOS)
        preview.alpha_composite(image, (px + (200 - image.width) // 2, py + 155 - image.height))
        draw.text((px + 8, py + 170), name, fill='#e0d5c3')
    preview.save(kit_dir / 'preview.png')
    print(f'Packed {len(frames)} sprites; runtime atlas {(destination / "studio-kit.webp").stat().st_size:,} bytes')
